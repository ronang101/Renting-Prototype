# Standard library imports.

# Standard library imports.
import json

# Local application/library-specific imports.
from database.db_connection_web import update_user_dicts


def update_preferences_web(conn, cur, user_id, interactions):
    """
    Updates user preferences in the database based on their recent
    interactions.

    Args:

    - conn: Database connection object.
    - cur: Database cursor object for executing queries.
    - user_id (int): ID of the user whose preferences are being updated.
    - interactions (list of tuples): List of tuples containing interaction
      data (user_id, interaction_type).


    Returns:

    - dict: Updated preferences dictionary after processing interactions.

    This function first retrieves the features of all users interacted with
    and updates the preferences based on the type of interaction (like,
    dislike, superlike). Preferences with negative values are removed.
    Finally, it updates the user's preferences in the database.
    """

    # Retrieve features for all interacted accounts in one query.
    user_ids = [user_id2 for user_id2, _ in interactions]
    features_query = "SELECT id, features FROM user_base WHERE id = ANY(%s)"
    cur.execute(features_query, (user_ids,))
    users_info = cur.fetchall()
    users_info_dict = {user_info[0]: user_info[1] for user_info in users_info}
    cur.execute(
        "SELECT users_user_preferences FROM user_base WHERE id = %s",
        (user_id,))
    preferences = cur.fetchone()[0]
    # Preparing data for batch update.
    update_data = []
    for user_id2, interaction_type in interactions:
        user_features = users_info_dict.get(user_id2, {})
        for feature, has_feature in user_features.items():
            if feature not in preferences:
                preferences[feature] = 0
            if interaction_type == 'liked':
                preferences[feature] += 1
            elif interaction_type == 'disliked':
                preferences[feature] -= 1
            elif interaction_type == 'superliked':
                preferences[feature] += 2

    # Remove preferences with negative values.
    preferences = {k: v for k, v in preferences.items() if v > 0}
    # Check if the dictionary is empty.
    if not preferences:
        # Add a default key-value pair.
        preferences['Vegetarian'] = 1
    total_interactions = sum(preferences.values())
    update_data.append((json.dumps(preferences), total_interactions, user_id))
    # Batch update.
    update_query = """UPDATE user_base SET users_user_preferences = %s,
    Total_interactions = %s WHERE id = %s"""
    cur.executemany(update_query, update_data)
    update_user_dicts(cur, user_id, preferences, 'preference')
    conn.commit()
