# Standard library imports.

# Related third-party imports.
import heapq

# Local application/library-specific imports.


def fetch_user_interactions(cur, top_matches):
    """
    Retrieves interactions of types 'liked' and 'superliked' for users with
    similar preferences to the target user for use in collab filtering.

    Args:

    - cur: Database cursor for executing SQL queries.
    - top_matches (list): A list of user IDs representing the top matches.

    Returns:

    - list: A list of tuples with user interactions
      (user_id, interaction_type).
    """
    
    # Execute a SQL query to select interactions where the current user
    # (user_id1) has 'liked' or 'superliked' another user (user_id2).
    # The query filters interactions based on a list of top matches.
    cur.execute("""
        SELECT user_id2, interaction_type FROM user_base_interactions
        WHERE user_id1 IN %s AND interaction_type IN ('liked', 'superliked')
    """, (tuple(top_matches),))
    # Fetch all rows of query result, returning them to the caller.
    # This includes the user_id of the interacted users and the type of
    # interaction.
    return cur.fetchall()


def aggregate_interactions(interactions, candidate_ids):
    """
    Aggregates interaction data to calculate a score for each candidate based
    on likes and superlikes received from the target user. The purpose is to
    find which candidates have been interacted with most in order to recommend
    them to the user.

    Args:

    - interactions (list): A list of tuples containing interaction data
      (user_id, interaction_type).
    - candidate_ids (list): A list of candidate user IDs to aggregate
      interactions for.

    Returns:

    - dict: A dictionary mapping candidate IDs to their aggregated interaction
      scores.
    """

    # Initialize a dictionary to keep track of the sum of interactions for
    # each candidate.
    interaction_sums = {candidate_id: 0 for candidate_id in candidate_ids}
    # Loop through each interaction.
    for user_id, interaction_type in interactions:
        # If the interaction is a 'like' and the user is a candidate, increment
        # their score by 1.
        if interaction_type == 'liked' and user_id in interaction_sums:
            interaction_sums[user_id] += 1
            # If the interaction is a 'superlike' and the user is a candidate,
            # increment their score by 2.
        if interaction_type == 'superliked' and user_id in interaction_sums:
            interaction_sums[user_id] += 2
    # Return the dictionary of interaction sums.
    return interaction_sums


def collab_filtering(cur, candidate_ids, top_matches, n):
    """
    Implements collaborative filtering to identify top 'n' candidates based on
    user interactions.
    Fetches and aggregates interaction data, then selects the candidates with
    the highest interaction scores.

    Args:

    - cur: Database cursor for executing SQL queries.
    - candidate_ids (list): A list of candidate user IDs for filtering.
    - top_matches (list): A list of top matched user IDs.
    - n (int): Number of top candidates to return.

    Returns:

    - list: A list of top 'n' candidate user IDs based on aggregated
      interaction scores.
    """

    # Fetch interactions for the target user and top matches.
    interactions = fetch_user_interactions(cur, top_matches)
    # Aggregate interactions to find the most liked candidates.
    interaction_sums = aggregate_interactions(interactions, candidate_ids)

    # Select top `n` candidates based on the interaction sums.
    sorted_candidates = heapq.nlargest(
        n, interaction_sums, key=interaction_sums.get)

    return sorted_candidates
