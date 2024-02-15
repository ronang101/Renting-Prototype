def create_filter_query(filters, user_id, filter_uni, filter_prof):
    """
    Constructs an SQL query to filter users based on specified criteria and
    excludes users who have already interacted with the current user.

    Args:

    - filters (dict): A dictionary containing the user's filter preferences.
    - user_id (int): The ID of the current user, used to exclude their
      previous interactions.
    - filter_uni (bool): Flag to determine if university filter should be
      applied.
    - filter_prof (bool): Flag to determine if profession filter should be
      applied.

    Returns:

    - str: An SQL query string for fetching filtered user data.
    """
    
    # Base query for filtering users from the user_filter_data table.
    query = f"""
    SELECT user_id,
        EXISTS (
            SELECT 1
            FROM user_base_interactions
            WHERE user_base_interactions.user_id1 = {user_id}
            AND user_base_interactions.user_id2 = user_filter_data.user_id
        ) AS interacted
    FROM user_filter_data
    WHERE city = '{filters['city']}'
    AND move_in_date_start <= '{filters['moving_filter'][1]}'
    AND move_in_date_end >= '{filters['moving_filter'][0]}'
    """

    # Additional filters based on profession, and university.

    if filter_prof:
        query += f"AND profession = '{filters['profession']}'"
    if filter_uni:
        query += f"AND university = '{filters['university']}'"

    # Split up query to filter database on filters which work the fastest
    # first.
    query += f"""
    AND age BETWEEN {filters['age_filter'][0]} AND {filters['age_filter'][1]}
    AND rent_amount BETWEEN {filters['rent_filter'][0]} AND
    {filters['rent_filter'][1]}
    AND user_id != {user_id}
    ORDER BY RANDOM()
    LIMIT 1000
    """

    return query


def apply_filters(cur, filters, user_id, filter_uni, filter_prof):
    """
    Applies the given filters to fetch users from the database, excluding users
    already interacted with by the current user.

    Args:

    - cur: Database cursor for executing SQL queries.
    - filters (dict): A dictionary containing filter criteria.
    - user_id (int): The ID of the current user to exclude their interactions.
    - filter_uni (bool): Indicates if university filter should be applied.
    - filter_prof (bool): Indicates if profession filter should be applied.

    Returns:

    - tuple: A tuple containing two lists - all_users (all filtered users
      which will be used for collab filtering) and non_interacted_users
      (users not yet interacted with).
    """
    
    # Obtain the filter query from the create filter query function.
    query = create_filter_query(filters, user_id, filter_uni, filter_prof)
    cur.execute(query)
    results = cur.fetchall()
    # Create two seperate lists for all users and users not yet interacted
    # with who fall within filters.
    all_users = [row[0] for row in results]
    non_interacted_users = [row[0] for row in results if not row[1]]
    return all_users, non_interacted_users
