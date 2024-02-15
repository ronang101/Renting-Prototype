# Standard library imports.
import json
import os
import io

# Related third-party imports.
from flask import request
import requests
from PIL import Image
import boto3

# Local application/library-specific imports.
from algorithms.web_recommendations import mixed_filtering
from database.db_connection_web import update_user_dicts


def parse_filter_range(filter_range, base_value):
    """
    Parses a filter range string and calculates the minimum and maximum values
    based on a base value.

    Args:

    - filter_range (str): A string representing the range filter, e.g.,
      "+/- 100".
    - base_value (int): The base value to calculate the range from.

    Returns:

    - tuple: A tuple containing the minimum and maximum values of the range.
    """
    
    # Extracting only digits from the filter_range string and converting to an
    # integer.
    number_part = ''.join(filter(str.isdigit, filter_range))
    range_value = int(number_part)
    # Calculating and returning the minimum and maximum values of the range.
    return base_value - range_value, base_value + range_value


def add_user(firebase_uid, conn):
    """
    Adds a new user to the database from a web form submission.

    Args:

    - firebase_uid (str): A string representing the users firebase_uid, this
      will be provided upon signing in.
    - conn: Database connection object.

    Returns:

    - int: An integer representing the users ID in order to add to the session.

    This function extracts user information from a submitted web form,
    including personal details, preferences, and filters. It then creates
    a new user record in the database and returns the new user's id
    in order to add them to the session. This function also handles
    the standard formatting of profile pictures (300x300px) and fetching
    a users isochrone.
    """
    
    # Initialize boto3 client with environment variables.
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.environ.get('aws_access_key_id'),
        aws_secret_access_key=os.environ.get('aws_secret_access_key'),
        config=boto3.session.Config(signature_version='s3v4'),
        region_name='eu-west-2'
    )

    # Extracting user data from the form.
    name = request.form['name']
    age = int(request.form['age'])
    rent_amount = int(request.form['rent_amount'])
    # Converting features and preferences into dictionaries.
    features = request.form.getlist('features')
    # Convert to dict.
    preferences_dict = {preference: 50 for preference in features}
    features_dict = {feature: True for feature in features}  # Convert to dict.
    age_filter = request.form['age_filter']  # e.g., "+/- 1 year".
    rent_filter = request.form['rent_filter']  # e.g., "+/- £100".
    # Calculating the minimum and maximum age and rent filters from
    # the input range.
    # Ensuring rent filters are within specified bounds.
    age_filter_min, age_filter_max = parse_filter_range(age_filter, age)
    rent_filter_min, rent_filter_max = parse_filter_range(
        rent_filter, rent_amount)
    university = request.form['university_filter']
    city = request.form['city_filter']
    profession = request.form['profession_filter']
    duration = request.form['duration']
    filter_university = 'filter_same_university' in request.form
    filter_profession = 'filter_same_occupation' in request.form
    move_in_date_start = request.form['move_in_date_start']
    move_in_date_end = request.form['move_in_date_end']
    contact = request.form['contact_info']
    bio = request.form['bio']
    # Preparing a dictionary of filters based on user input for later use.
    filters = {
        "age_filter": [age_filter_min, age_filter_max],
        "rent_filter": [rent_filter_min, rent_filter_max],
        "university": university,
        "moving_filter": [move_in_date_start, move_in_date_end],
        "location_filter_radius": [],
        "city": city,
        "profession": profession
    }
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')

    # Get transportation and time from the form.
    transportation_type = request.form.get('transportation_method')
    travel_time = request.form.get('travel_time')

    # Fetch the isochrone from Geoapify API.
    isochrone_response = requests.get(
        'https://api.geoapify.com/v1/isoline',
        params={
            'lat': latitude,
            'lon': longitude,
            'type': 'time',
            'mode': transportation_type,
            'range': travel_time,
            'apiKey': 'a2389f2ad41c4dfb9a8c5d811ca05451'
        }
    )

    isochrone_data = isochrone_response.json()
    # Convert the entire GeoJSON object to a string to store in the database.
    essential_geodata_str = json.dumps(isochrone_data)

    cur = conn.cursor()
    # Formulating SQL query to insert the new user's data into the database.
    insert_query = """
    INSERT INTO user_base (firebase_uid,name, age, rent_amount, features,
    users_user_preferences, users_properties_preferences, total_interactions,
    filters, latitude, longitude, contact_info, bio, duration,
    filter_university, filter_occupation, isochrone, transportation_method,
    travel_time)
    VALUES (%s,%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
    %s, %s)
    RETURNING id
    """
    # Inserting the new user into the database.
    # Execute the insert query with parameters.
    cur.execute(insert_query, (
        firebase_uid,
        name,
        age,
        rent_amount,
        json.dumps(features_dict),
        json.dumps(preferences_dict),
        json.dumps({}),
        0,
        json.dumps(filters),
        latitude,
        longitude,
        contact,
        bio,
        duration,
        filter_university,
        filter_profession,
        essential_geodata_str,
        transportation_type,
        travel_time
    ))

    # Fetch the returned user_id.
    user_id = cur.fetchone()[0]

    insert_query = """
    INSERT INTO user_filter_data (user_id, age, rent_amount, city, profession,
    university, move_in_date_start, move_in_date_end)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """
    # Inserting the new user into the database.
    # Execute the insert query with parameters.
    cur.execute(insert_query, (
        user_id,
        age,
        rent_amount,
        city,
        profession,
        university,
        move_in_date_start,
        move_in_date_end

    ))

    # Update the user features and user preferences table to include the new
    # user.
    update_user_dicts(cur, user_id, features_dict, 'feature')
    update_user_dicts(cur, user_id, preferences_dict, 'preference')

    conn.commit()

    # Handling the upload and processing of the user's profile image.
    if 'profile_image' in request.files:
        file = request.files['profile_image']
        if file.filename != '':
            try:
                img = Image.open(file.stream)
                width, height = img.size
                aspect_ratio = width / height
                if aspect_ratio > 1:  # Wide image.
                    new_height = 340
                    new_width = int(aspect_ratio * new_height)
                else:  # Tall image.
                    new_width = 340
                    new_height = int(new_width / aspect_ratio)

                img = img.resize(
                    (new_width, new_height), Image.Resampling.LANCZOS)

                # Crop the center of the image.
                left = (new_width - 340) / 2
                top = (new_height - 340) / 2
                right = (new_width + 340) / 2
                bottom = (new_height + 340) / 2

                img = img.crop((left, top, right, bottom))
                # Convert the PIL image to a bytes object.
                img_byte_arr = io.BytesIO()
                img.convert('RGB').save(img_byte_arr, format='JPEG')
                img_byte_arr = img_byte_arr.getvalue()

                # Create a filename.
                filename = f"profile_picture_{user_id}.jpg"

                # Upload the image to S3.
                s3_client.put_object(
                    Bucket='renting-prototype',
                    Key=filename,
                    Body=img_byte_arr,
                    ContentType='image/jpeg'
                )
            except IOError:
                print("Cannot process the uploaded image.")
    cur.close()

    return user_id


def update_user_data(conn):
    """
    Updates an existing user's data in the database.
    
    Args:

    - conn: Database connection object.

    Returns:

    - int: The ID of the user whose data was updated.

    This function extracts updated user information from a submitted web form
    and updates the user record in the database. It handles updates to personal
    details, preferences, and filters, and returns the user's ID.
    This function also handles the standard formatting of profile pictures
    (300x300px), fetching of a new isochrone and it updates the recommendations
    database by calculating recommendations for the user based on their updated
    information.
    """
   
    # Initialize boto3 client with environment variables.
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.environ.get('aws_access_key_id'),
        aws_secret_access_key=os.environ.get('aws_secret_access_key'),
        config=boto3.session.Config(signature_version='s3v4'),
        region_name='eu-west-2'
    )
    # Extracting updated user data from the form.
    user_id = int(request.form['user_id'])
    name = request.form['name']
    age = int(request.form['age'])
    rent_amount = int(request.form['rent_amount'])
    # Converting features and preferences into dictionaries.
    features = request.form.getlist('features')
    preferences = request.form.getlist('preferences')
    # Convert to dict.
    preferences_dict = {preference: 50 for preference in preferences}
    features_dict = {feature: True for feature in features}  # Convert to dict.
    age_filter = request.form['age_filter']  # e.g., "+/- 1 year".
    rent_filter = request.form['rent_filter']  # e.g., "+/- £100".
    # Calculating the minimum and maximum age and rent filters from the input
    # range.
    # Ensuring rent filters are within specified bounds.
    age_filter_min, age_filter_max = parse_filter_range(age_filter, age)
    rent_filter_min, rent_filter_max = parse_filter_range(
        rent_filter, rent_amount)
    university = request.form['university_filter']
    city = request.form['city_filter']
    profession = request.form['profession_filter']
    duration = request.form['duration']
    filter_university = 'filter_same_university' in request.form
    filter_profession = 'filter_same_occupation' in request.form
    move_in_date_start = request.form['move_in_date_start']
    move_in_date_end = request.form['move_in_date_end']
    contact = request.form['contact_info']
    bio = request.form['bio']
    # Preparing filters based on user input.
    filters = {
        "age_filter": [age_filter_min, age_filter_max],
        "rent_filter": [rent_filter_min, rent_filter_max],
        "university": university,
        "moving_filter": [move_in_date_start, move_in_date_end],
        "location_filter_radius": [],
        "city": city,
        "profession": profession
    }
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')

    # Get transportation and time from the form.
    transportation_type = request.form.get('transportation_method')
    travel_time = request.form.get('travel_time')

    # Fetch the isochrone from Geoapify API.
    isochrone_response = requests.get(
        'https://api.geoapify.com/v1/isoline',
        params={
            'lat': latitude,
            'lon': longitude,
            'type': 'time',  # assuming you're using time-based isochrones.
            'mode': transportation_type,
            'range': travel_time,
            'apiKey': 'a2389f2ad41c4dfb9a8c5d811ca05451'
        }
    )

    isochrone_data = isochrone_response.json()
    # Convert the entire GeoJSON object to a string to store in the database.
    essential_geodata_str = json.dumps(isochrone_data)

    cur = conn.cursor()

    # Checking if preferences exist and preparing the SQL update query
    # accordingly.
    if preferences:
        cur.execute(
            """UPDATE user_base SET name = %s, age = %s, rent_amount = %s,
            users_user_preferences = %s, features = %s,  filters= %s,
            contact_info = %s, bio = %s, duration = %s, filter_university = %s,
            filter_occupation = %s, longitude = %s, latitude = %s,
            isochrone = %s, transportation_method = %s, travel_time = %s
            WHERE id = %s""",
            (name,
             age,
             rent_amount,
             json.dumps(preferences_dict),
             json.dumps(features_dict),
             json.dumps(filters),
             contact,
             bio,
             duration,
             filter_university,
             filter_profession,
             longitude,
             latitude,
             essential_geodata_str,
             transportation_type,
             travel_time,
             user_id))

        # Update the user features and user preferences table to include the
        # edits.
        update_user_dicts(cur, user_id, features_dict, 'feature')
        update_user_dicts(cur, user_id, preferences_dict, 'preference')

        update_query = """
            UPDATE user_filter_data
            SET age = %s,
                rent_amount = %s,
                city = %s,
                profession = %s,
                university = %s,
                move_in_date_start = %s,
                move_in_date_end = %s
            WHERE user_id = %s
        """
        # Execute the update query with parameters.
        cur.execute(update_query, (
            age,
            rent_amount,
            city,
            profession,
            university,
            move_in_date_start,
            move_in_date_end,
            user_id
        ))

    else:
        cur.execute(
            """UPDATE user_base SET name = %s, age = %s, rent_amount = %s,
            features = %s, filters= %s, contact_info = %s,bio = %s,
            duration = %s, filter_university = %s, filter_occupation = %s,
            longitude = %s, latitude = %s, isochrone = %s,
            transportation_method = %s, travel_time = %s WHERE id = %s""",
            (name,
             age,
             rent_amount,
             json.dumps(features_dict),
             json.dumps(filters),
             contact,
             bio,
             duration,
             filter_university,
             filter_profession,
             longitude,
             latitude,
             essential_geodata_str,
             transportation_type,
             travel_time,
             user_id))
        # Update the user features table to include the edits.
        update_user_dicts(cur, user_id, features_dict, 'feature')
        update_query = """
            UPDATE user_filter_data
            SET age = %s,
                rent_amount = %s,
                city = %s,
                profession = %s,
                university = %s,
                move_in_date_start = %s,
                move_in_date_end = %s
            WHERE user_id = %s
        """
        # Execute the update query with parameters.
        cur.execute(update_query, (
            age,
            rent_amount,
            city,
            profession,
            university,
            move_in_date_start,
            move_in_date_end,
            user_id
        ))

    mixed_filtering(
        user_id,
        cur,
        conn,
        filters,
        filter_university,
        filter_profession,
        10)

    conn.commit()
    # Handling the upload and processing of the user's updated profile image.
    if 'profile_image' in request.files:
        file = request.files['profile_image']
        if file.filename != '':
            try:
                img = Image.open(file.stream)
                width, height = img.size
                aspect_ratio = width / height
                if aspect_ratio > 1:  # Wide image.
                    new_height = 340
                    new_width = int(aspect_ratio * new_height)
                else:  # Tall image.
                    new_width = 340
                    new_height = int(new_width / aspect_ratio)

                img = img.resize(
                    (new_width, new_height), Image.Resampling.LANCZOS)

                # Crop the center of the image.
                left = (new_width - 340) / 2
                top = (new_height - 340) / 2
                right = (new_width + 340) / 2
                bottom = (new_height + 340) / 2

                img = img.crop((left, top, right, bottom))

                # Convert the PIL image to a bytes object.
                img_byte_arr = io.BytesIO()
                img.convert('RGB').save(img_byte_arr, format='JPEG')
                img_byte_arr = img_byte_arr.getvalue()

                # Create a filename.
                filename = f"profile_picture_{user_id}.jpg"

                # Upload the image to S3.
                s3_client.put_object(
                    Bucket='renting-prototype',
                    Key=filename,
                    Body=img_byte_arr,
                    ContentType='image/jpeg'
                )
            except IOError:
                print("Cannot process the uploaded image.")
    cur.close()

    return user_id
