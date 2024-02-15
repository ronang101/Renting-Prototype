# Standard library imports.

# Related third-party imports.
import numpy as np
from sklearn.preprocessing import normalize

# Local application/library-specific imports.


def update_user_dicts(cur, user_id, data, data_type):
    """
    Updates a single user's features or preferences in the database.

    Args:
    - cur: Database cursor object for executing queries.
    - user_id: ID of the user to update.
    - data: Dictionary containing features or preferences.
    - data_type: Type of data to update ('features' or 'preferences').

    Returns:
    - None
    """

    # Convert feature names to IDs and prepare data for insertion.
    feature_name_to_id_map = {
        'Non-smoker': 1,
        'Dog Lover': 2,
        'Likes to go out': 3,
        'Vegetarian': 4,
        'Gym Enthusiast': 5,
        'Early Riser': 6,
        'Night Owl': 7,
        'Freelancer': 8,
        'Student': 9,
        'Full-time Job': 10,
        'Likes Cooking': 11,
        'Plays Instruments': 12,
        'Allergic to Pets': 13,
        'Has a Car': 14,
        'Likes Hiking': 15,
        'Vegan': 16,
        'Tea Lover': 17,
        'Coffee Addict': 18,
        'Wine Enthusiast': 19,
        'Beer Lover': 20,
        'Plays Video Games': 21,
        'Loves Movies': 22,
        'Enjoys Reading': 23,
        'Social Butterfly': 24,
        'Introverted': 25,
        'Extroverted': 26,
        'Loves Sports': 27,
        'Enjoys Theatre': 28,
        'Art Lover': 29,
        'Photography Enthusiast': 30,
        'Traveler': 31,
        'Clean Freak': 32,
        'Laid Back': 33,
        'Adventurous': 34,
        'Homebody': 35,
        'Tech Savvy': 36,
        'Fashion Conscious': 37,
        'Foodie': 38,
        'Loves Music': 39,
        'Dancer': 40,
        'Fitness Freak': 41,
        'Yoga Enthusiast': 42,
        'Meditation Practitioner': 43,
        'Nature Lover': 44,
        'Beach Bum': 45,
        'Mountain Climber': 46,
        'Snowboarder': 47,
        'Skier': 48,
        'Cyclist': 49,
        'Runner': 50,
        'Swimmer': 51,
        'Gardener': 52,
        'DIY Enthusiast': 53,
        'Baker': 54,
        'History Buff': 55,
        'Science Geek': 56,
        'Political Junkie': 57,
        'Volunteer': 58,
        'Charity Worker': 59,
        'Environmental Activist': 60,
        'Religious': 61,
        'Spiritual': 62,
        'Agnostic': 63,
        'Atheist': 64,
        'Optimist': 65,
        'Pessimist': 66,
        'Realist': 67,
        'Idealist': 68,
        'Sarcastic': 69,
        'Humorous': 70,
        'Serious': 71,
        'Romantic': 72,
        'Pragmatic': 73,
        'Spontaneous': 74,
        'Organized': 75,
        'Disorganized': 76,
        'Thrifty': 77,
        'Luxury Lover': 78,
        'Minimalist': 79,
        'Maximalist': 80,
        'Risk Taker': 81,
        'Cautious': 82,
        'Innovative': 83,
        'Traditional': 84,
        'Modern': 85,
        'Old-fashioned': 86,
        'Futuristic': 87,
        'Nostalgic': 88,
        'Patriotic': 89,
        'Global Citizen': 90,
        'Local Enthusiast': 91,
        'Urbanite': 92,
        'Country Lover': 93,
        'Suburban Dweller': 94,
        'Island Dreamer': 95,
        'Desert Wanderer': 96,
        'Jungle Explorer': 97,
        'Space Enthusiast': 98,
        'Trekkie': 99,
        'Star Wars Fan': 100,
        'Comic Book Lover': 101,
        'Anime Fan': 102,
        'Manga Reader': 103,
        'Podcast Listener': 104,
        'News Junkie': 105,
        'Social Media Maven': 106,
        'Digital Detoxer': 107,
        'Pet Owner': 108,
        'Child-Free': 109,
        'Parent': 110,
        'Single': 111,
        'In a Relationship': 112,
        'Married': 113,
        'Divorced': 114,
        'Widowed': 115,
        'Young at Heart': 116,
        'Old Soul': 117}
    # Initializes a dictionary to store data ready for database insertion.
    data_for_db = {}
    for feature_name, value in data.items():
        # Checks if the feature name is recognized and maps it to its ID.
        if feature_name in feature_name_to_id_map:
            feature_id = feature_name_to_id_map[feature_name]
            # Stores the feature ID with a binary flag for features or the
            # actual value for preferences.
            data_for_db[feature_id] = 1 if data_type == 'feature' else value

    # Converts the feature/preference values into a numpy array for
    # normalization.
    values = np.array(list(data_for_db.values())).reshape(1, -1)
    # Normalizes the values using L2 normalization, making similarity
    # calculations easier.
    normalized_values = normalize(values, norm='l2').ravel()

    # Pairs the feature IDs with their corresponding normalized values.
    paired_data = zip(data_for_db.keys(), normalized_values)

    # If updating preferences, keep top 10.
    if data_type == 'preference':
        paired_data = sorted(
            paired_data,
            key=lambda x: x[1],
            reverse=True)[
            :10]

    # Determines the table name based on whether the data is for features or
    # preferences.
    table_name = f"user_{data_type}s"

    # Deletes existing entries for the user in the feature/preference table to
    # prevent duplicates.
    cur.execute(f"DELETE FROM {table_name} WHERE user_id = %s", (user_id,))
    # Update the database.
    for feature_id, normalized_value in paired_data:
        cur.execute(f"""
            INSERT INTO {table_name} (user_id, feature_id, {data_type}_value)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, feature_id)
            DO UPDATE SET {data_type}_value = EXCLUDED.{data_type}_value;
        """, (user_id, feature_id, normalized_value))


def get_user_data(cur, user_id):
    """
    Fetches and formats a specific user's data from the database, this is used
    for the edit page in order to pre populate the form fields.

    Args:

    - cur: Database cursor for executing queries.
    - user_id (int): The ID of the user whose data is to be fetched.

    Returns:

    - dict: A dictionary containing detailed information of the user.
    """
    
    # Execute a query to fetch user data based on the user ID.
    cur.execute("""SELECT id,name, age, rent_amount, features, filters,
                contact_info, bio, duration, filter_university,
                filter_occupation, longitude, latitude, transportation_method,
                travel_time FROM user_base WHERE id = %s""", (user_id,))
    row = cur.fetchone()
    filters = row[5]
    # Format age and rent filters into a more readable string format.
    age_diff = (filters['age_filter'][1] - filters['age_filter'][0]) // 2
    rent_diff = (filters['rent_filter'][1] - filters['rent_filter'][0]) // 2

    age_filter_str = f"My Age +/- {age_diff} year{'s' if age_diff > 1 else ''}"
    rent_filter_str = f"My Budget +/- £{rent_diff}"

    # Update the filters with the new string format.
    filters['age_filter'] = age_filter_str
    filters['rent_filter'] = rent_filter_str
    # Prepare user data dictionary.
    user_data = {
        'id': row[0],
        'name': row[1],
        'age': row[2],
        'rent_amount': row[3],
        'features': row[4],
        'filters': filters,
        'contact_info': row[6],
        'bio': row[7],
        'duration': row[8],
        'filter_university': row[9],
        'filter_occupation': row[10],
        'longitude': row[11],
        'latitude': row[12],
        'transportation_method': row[13],
        'travel_time': row[14]
    }
    # Return the formatted user data.
    return user_data


def get_matches(cur, user_id):
    """
    Retrieves matches for a specific user from the database.

    Args:

    - cur: Database cursor for executing queries.
    - user_id (int): The ID of the user for whom matches are being fetched.

    Returns:

    - list: A list of dictionaries, each containing detailed information about
      a match. All infromation included is required to populate a match card on
      the front end.
    """
    
    # Query the database for matches involving the specified user.
    match_query = """
    SELECT * FROM matches
    WHERE user_id1 = %s OR user_id2 = %s;
    """
    cur.execute(match_query, (user_id, user_id))

    # Fetch all matching rows.
    matches = cur.fetchall()

    # This list will hold the formatted match data.
    formatted_matches = []

    # Loop through the matches and fetch the corresponding user info.
    for match in matches:
        # Determine the ID of the other user in the match.
        match_user_id = match[2] if int(match[1]) == int(user_id) else match[1]

        # Query the user_base table for the other user's information.
        user_info_query = """
        SELECT id, name, age, features, filters -> 'rent_filter' as
        rent_filter, filters -> 'moving_filter' as moving_filter, filters
        -> 'university' as university, filters -> 'city' as city, filters
        -> 'profession' as profession, bio, duration,firebase_uid FROM
        user_base WHERE id = %s;
        """
        cur.execute(user_info_query, (match_user_id,))
        user_info = cur.fetchone()

        formatted_match = {
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
            'uid': user_info[11]
        }
        formatted_matches.append(formatted_match)
    # Return a list of formatted matches.
    return formatted_matches


def account_deletion(user_id, conn, cur):
    """
    Deletes a user's account and all associated data from the database.

    Args:

    - user_id (int): The ID of the user whose account is to be deleted.
    - conn: Database connection object.
    - cur: Database cursor for executing queries.

    Returns:

    - bool: True if the deletion was successful, False otherwise.
    """
    
    try:
        # Execute queries to delete the user's interactions, matches, and
        # account data.
        cur.execute(
            """DELETE FROM user_base_interactions WHERE user_id1 = %s OR
            user_id2 = %s""",
            (user_id,
             user_id,
             ))

        cur.execute(
            "DELETE FROM matches WHERE user_id1 = %s OR user_id2 = %s",
            (user_id,
             user_id,
             ))
        
        cur.execute(
            "DELETE FROM user_reports WHERE user_id1 = %s OR user_id2 = %s",
            (user_id,
             user_id,
             ))

        cur.execute(
            "DELETE FROM user_preferences WHERE user_id = %s", (user_id,))

        cur.execute("DELETE FROM user_features WHERE user_id = %s", (user_id,))

        cur.execute(
            "DELETE FROM user_filter_data WHERE user_id = %s", (user_id,))

        cur.execute(
            "DELETE FROM user_recommendations WHERE user_id = %s", (user_id,))

        cur.execute("DELETE FROM user_base WHERE id = %s", (user_id,))

        # Commit the changes to the database.
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()  # Rollback the transaction in case of an error.
        print(f"An error occurred: {e}")
        return False


def check_user_exists(cur, firebase_uid):
    """
    Checks if a user exists in the database based on Firebase UID.

    Args:

    - cur: Database cursor for executing queries.
    - firebase_uid (str): Firebase UID of the user.

    Returns:

    - int/None: The user ID if the user exists, None otherwise.
    """
    
    # Execute a query to find the user ID associated with the given Firebase
    # UID.
    cur.execute("SELECT id FROM user_base WHERE firebase_uid = %s",
                (firebase_uid,))
    user_id = cur.fetchone()
    if user_id:
        user_id = user_id[0]

    return user_id


def get_user_isochrone_data(cur, user_id):
    """
    Retrieves the isochrone data along with latitude and longitude for a given
    user from the database.

    This function executes a SQL query to fetch the isochrone data, which
    represents the geographic area accessible within a certain time frame
    from the user's location. It also retrieves the user's latitude and
    longitude coordinates.

    Args:

    - cur: The database cursor used to execute the query.
    - user_id (int): The ID of the user for whom to retrieve the isochrone
      data.

    Returns:

    - tuple: A tuple containing the isochrone data as a JSON object (or other
      format depending on the database), and the latitude and longitude
      coordinates of the user as floats.
    """
    
    # Execute a SQL query to select the isochrone, latitude, and longitude for
    # the specified user.
    cur.execute(
        "SELECT isochrone, latitude, longitude FROM user_base WHERE id = %s",
        (user_id,
         ))
    # Fetch the first (and should be only) row of the query result.
    result = cur.fetchone()
    isochrone_data = result[0]  # Extract the isochrone data from the result.
    lat = result[1]  # Extract the latitude.
    lon = result[2]  # Extract the longitude.

    # Return the isochrone data along with latitude and longitude.
    return isochrone_data, lat, lon
