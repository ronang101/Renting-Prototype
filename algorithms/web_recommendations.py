# Standard library imports.

# Related third-party imports.
from flask import jsonify
import numpy as np

# Local application/library-specific imports.
from algorithms.collaborative_filtering_web import collab_filtering
from database.apply_filters import apply_filters
from utils.similarity_metrics import get_top_matches
from utils.update_data_structures import update_preferences_web


def mixed_filtering(user_id, cur, conn, filters, filter_uni,
                    filter_prof, n=125):
    """
    Performs multiple forms of recommendation generation to generate
    personalized recommendations for a user.
    Combines collaborative filtering, content-based filtering, and random
    selection.

    Args:

    - user_id (int): ID of the current user.
    - cur: Database cursor for executing SQL queries.
    - conn: Database connection object.
    - filters (dict): Dictionary of user-specific filtering criteria.
    - filter_uni (bool): Flag to indicate if university-based filtering is
      applied.
    - filter_prof (bool): Flag to indicate if profession-based filtering is
      applied.
    - n (int, optional): Number of recommendations to generate. Default is 125.

    Returns:

    - list: List of recommended user IDs after applying mixed filtering.
    """
    
    # Applying filters to get potential user matches.
    all_users, non_interacted_users = apply_filters(
        cur, filters, user_id, filter_uni, filter_prof)
    # If the number of unseen candidates is too small, return them as
    # recommendations.
    if len(non_interacted_users) <= n * 3:
        # Insert or update the matches in the user_recommendations table to
        # avoid recalculating matches.
        cur.execute("""
            INSERT INTO user_recommendations (user_id, recommendation_ids,
                    last_updated)
            VALUES (%s, %s,NOW())
            ON CONFLICT (user_id) DO UPDATE
            SET recommendation_ids = excluded.recommendation_ids,
                last_updated = NOW();
        """, (user_id, non_interacted_users))
        # Commit the changes to the database.
        conn.commit()
        return non_interacted_users
    # Get top matches using collaborative filtering to find users with similar
    # preferences.
    collab_matches = get_top_matches(cur, user_id, all_users, "preference", 5)
    # Obtaining collaborative filtering matches.
    matches = collab_filtering(cur, non_interacted_users, collab_matches, n)
    # Filtering out already matched candidates to avoid double recommending.
    candidate_ids = np.setdiff1d(non_interacted_users, matches)
    # Obtaining content-based filtering matches.
    content_matches = get_top_matches(
        cur, user_id, candidate_ids, "feature", n)
    # Merging content and collaborative matches.
    matches.extend(content_matches)
    # Removing selected matches from candidate indices again to avoid double
    # recommending.
    candidate_ids = np.setdiff1d(candidate_ids, content_matches)
    # Randomly selecting additional matches from remaining candidates.
    random_indices = np.random.choice(
        candidate_ids, size=min(
            len(candidate_ids), n), replace=False)
    # Final list of matches combines collaborative, content-based, and random
    # selections.
    matches.extend(random_indices)
    # Format the matches ready to send to the front end.
    matches = [int(id) for id in matches]
    # Insert or update the matches in the user_recommendations table to avoid
    # recalculating matches.
    cur.execute("""
        INSERT INTO user_recommendations (user_id, recommendation_ids,
                last_updated)
        VALUES (%s, %s,NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET recommendation_ids = excluded.recommendation_ids,
            last_updated = NOW();
    """, (user_id, matches))
    # Commit the changes to the database.
    conn.commit()
    return matches


def get_recommendations_for_user(cur, conn, user_id, generate=True):
    """
    Fetches personalized recommendations for a specific user based on their
    preferences and then formats the recommendations by querying the database
    for return to the front end.

    Args:

    - cur: Database cursor for executing SQL queries.
    - conn: Database connection object.
    - user_id (int): ID of the user for whom recommendations are being fetched.
    - generate (Booleon): Indicator for the need of generated recommendations
      or fetched recommendations.

    Returns:

    - list: A list of formatted recommendations including user details.
    """
    
    try:
        # Check if this function call was to generate recommendations or check
        # for pre existing recommendations.
        if generate:
            # Fetch user's preferences and filters from the database.
            cur.execute(
                """SELECT filters, filter_university, filter_occupation FROM
                user_base WHERE id = %s""",
                (user_id,
                 ))
            user_data = cur.fetchone()
            # Check if user data exists; return empty list if not.
            if not user_data:
                return []
            # Extracting filters and university, profession flags.
            filters, filter_uni, filter_prof = user_data
            # Generating mixed filtering recommendations.
            recommendations = mixed_filtering(
                user_id, cur, conn, filters, filter_uni, filter_prof, 10)
        else:
            # Check for any pre exisiting recommendations in the database that
            # haven't yet been interacted with.
            cur.execute("""
                SELECT unnested_recommendations
                FROM (
                    SELECT unnest(recommendation_ids) AS
                        unnested_recommendations, user_id
                    FROM user_recommendations
                ) AS ur
                WHERE user_id = %s AND NOT EXISTS (
                    SELECT 1 FROM user_base_interactions
                    WHERE user_base_interactions.user_id1 = ur.user_id
                    AND user_base_interactions.user_id2 =
                        ur.unnested_recommendations
                );
            """, (user_id,))
            # Generate the recommendations id's list.
            recommendations = [row[0] for row in cur.fetchall()]
        # Query to fetch detailed info of recommended users.
        user_details_query = """SELECT id, name, age, features,filters ->
        'rent_filter' as rent_filter, filters -> 'moving_filter' as
        moving_filter, filters -> 'university' as university, filters
        -> 'city' as city, filters -> 'profession' as profession, bio,
        duration, isochrone FROM user_base WHERE id = ANY(%s)"""
        cur.execute(user_details_query, (recommendations,))
        users_info = cur.fetchall()
        # Format the recommendations for the frontend by including details
        # required to fill in recommendation cards.
        formatted_recommendations = [{
            'id': user_info[0],
            'name': user_info[1],
            'age': user_info[2],
            'features': user_info[3],
            'rent_filter': user_info[4],
            'moving_filter': user_info[5],
            'university': user_info[6],
            'city': user_info[7],
            'profession': user_info[8],
            'bio': user_info[9],
            'duration': user_info[10],
            'geo': user_info[11]
        } for user_info in users_info]
        return formatted_recommendations
    except Exception as e:
        print(f"An error occurred: {e}")
        return []


def api_recommendations(request_data, user_id, conn, cur):
    """
    Handles the API request for generating user recommendations.

    Args:

    - request_data (dict): Data from the API request (contains user
      interactions).
    - user_id (int): ID of the user requesting recommendations.
    - conn: Database connection object.
    - cur: Database cursor for executing SQL queries.

    Returns:

    - list: JSON formatted list of recommendations.

    Before obtaining formatted recommendations from
    "get_recommendations_for_user" this function checks for any interactions
    sent from the front end in order to update the users preferences.
    """
    
    try:
        # Check if any interactions were included in the request.
        interactions = request_data.get('interactions', [])
        # Update user preferences if new interactions are provided.
        if interactions:
            interactions = [(int(item['recommendationId']),
                             item['interactionType']) for item in interactions]
            update_preferences_web(conn, cur, user_id, interactions)
        # Call function to get personalized recommendations.
        recommendations = get_recommendations_for_user(cur, conn, user_id)
        # Commit changes to database.
        conn.commit()
        # Format and return the recommendations in JSON format.
        return jsonify(recommendations)
    except Exception as e:
        print(f"An error occurred: {e}")
        return []
