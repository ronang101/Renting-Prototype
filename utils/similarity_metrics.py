def get_top_matches(cur, user_id, candidate_ids, data_type, n=5):
    """
    Retrieves the top 'n' matching candidates based on specific data types
    preferences or features (depending on which form of filtering we're doing).

    Args:

    - cur: Database cursor for executing SQL queries.
    - user_id (int): ID of the current user for whom matches are being found.
    - candidate_ids (list): List of potential candidate user IDs for matching.
    - data_type (str): Type of data to use for matching (e.g., 'preference',
      'feature').
    - n (int, optional): Number of top matches to retrieve. Default is 5.

    Returns:
    - list: List of top recommendation candidate IDs.
    """
    
    # SQL query to select top matches based on user preferences or features.
    query = f"""
    SELECT
        ufd.user_id AS recommendation_candidate_id
    FROM
        user_{data_type}s ufd
    INNER JOIN
        user_preferences up ON ufd.feature_id = up.feature_id
    WHERE
        up.user_id = {user_id} AND
        ufd.user_id IN {tuple(candidate_ids)}
    GROUP BY
        ufd.user_id
    ORDER BY
        SUM(ufd.{data_type}_value * up.preference_value) DESC
    LIMIT {n};
    """

    # Execute the query.
    cur.execute(query)

    # Fetch and process the results.
    top_recommendations = [row[0] for row in cur.fetchall()]

    return top_recommendations
