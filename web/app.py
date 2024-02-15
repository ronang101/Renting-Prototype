# Standard library imports.
import os
import sys
from urllib.parse import urlparse

# Related third-party imports.
from flask import (Flask, jsonify, redirect, render_template, request, session,
                   url_for)
from flask_cors import CORS
from psycopg2 import pool
import firebase_admin
from firebase_admin import credentials, auth
import boto3

# Local application/library-specific imports.
sys.path.insert(0, '..')  # Adjust path for local imports.
from algorithms.web_recommendations import (api_recommendations,
                                            get_recommendations_for_user)
from utils.interactions import (record_interaction, record_report,
                                remove_matches)
from database.user_creation import add_user, update_user_data
from database.db_connection_web import (account_deletion, check_user_exists,
                                        get_matches, get_user_data,
                                        get_user_isochrone_data)


# Parse the DATABASE_URL environment variable to extract database
# connection info.
result = urlparse(os.environ.get("DATABASE_URL"))
username = result.username  # Extract the username from the parsed URL.
password = result.password  # Extract the password.
# Extract the database name, omitting the leading '/'.
database = result.path[1:]
# Extract the hostname where the database is hosted.
hostname = result.hostname
port = result.port  # Extract the port number for the database connection.


# Initialize a database connection pool for efficient database connections
# management.
db_pool = pool.SimpleConnectionPool(
    minconn=1,  # Minimum number of database connections in the pool.
    maxconn=19,  # Maximum number of connections allowed in the pool.
    user=username,  # Database user name.
    password=password,  # Database password.
    host=hostname,  # Database host.
    port=port,  # Database port.
    database=database  # Database name.
)


app = Flask(__name__)  # Initialize a Flask application instance.

# Enable CORS (Cross-Origin Resource Sharing) for all routes to allow
# cross-domain requests.
CORS(app)
# Set a secret key for session management and security purposes.
app.secret_key = 'Redwood0803'


@app.route('/add_user', methods=['POST'])
def handle_add_user():
    """
    Flask route handler to add a new user to the system.

    This route handler extracts the Firebase UID from the session, adds new
    user data to the database, and redirects to the recommendations page
    with the new user's ID on successful addition.
    It returns an error message with HTTP status 500 upon failure.

    - Extracts Firebase UID from session.
    - If UID is not found, redirects to the login page.
    - Calls `add_user` to insert new user data into the database.
    - Redirects to recommendations page with the new user's ID on successful
      addition.
    - On exception, returns an error message with HTTP status 500.

    Returns:

    - On success: Redirect to the recommendations page for the new user.
    - On failure: Error message with status code 500.
    """

    try:
        # Get a database connection from the pool.
        conn = db_pool.getconn()
        # Check users sessions for firebase id, if there is none redirect to
        # login.
        firebase_uid = session.get('firebase_uid')
        if not firebase_uid:
            return redirect(url_for('login'))
        # Add user to db.
        user_id = add_user(firebase_uid, conn)
        # Assign session id as user_id.
        session['user_id'] = user_id
        # Return the connection to the pool.
        db_pool.putconn(conn)

        return redirect(url_for('show_recommendations', user_id=user_id))
    except Exception as e:
        return f"An error occurred: {e}", 500


@app.route('/api/recommendations', methods=['POST'])
def api_recommendation():
    """
    API endpoint to handle recommendation requests for a user.

    - Checks if the user is authenticated (user_id in session).
    - If not authenticated, returns a 401 Unauthorized error.
    - Parses request data (JSON) which contains user interactions.
    - Calls `api_recommendations` to process the data and fetch
      recommendations.

    Returns:

    - JSON: Response containing a list of recommendations containg dicts or an
      error message.
    """

    # Check if user is authenticated yet.
    if 'user_id' not in session:
        return jsonify({'error': 'User not authenticated'}), 401
    user_id = session['user_id']
    # Get a database connection from the pool and create a cursor.
    conn = db_pool.getconn()
    cur = conn.cursor()

    # Accept request data (potentially interaction data).
    request_data = request.json
    recommendations = api_recommendations(request_data, user_id, conn, cur)
    # Close the database cursor and return the connection to the pool.
    cur.close()
    db_pool.putconn(conn)
    # Return formatted recommendations.
    return recommendations


@app.route('/api/check_recommendations', methods=['GET'])
def api_check_recommendation():
    """
    API endpoint to handle recommendation check requests for a user to avoid
    calculating recommendations again.

    - Checks if the user is authenticated (user_id in session).
    - If not authenticated, returns a 401 Unauthorized error.
    - Parses request data (JSON) which contains user interactions.
    - Calls `api_check_recommendations` to fetch recommendations.

    Returns:

    - JSON: Response containing a list of recommendations containg dicts or an
      error message.
    """

    # Check if user is authenticated yet.
    if 'user_id' not in session:
        return jsonify({'error': 'User not authenticated'}), 401
    user_id = session['user_id']
    # Get a database connection from the pool and create a cursor.
    conn = db_pool.getconn()
    cur = conn.cursor()
    # Call the function below to check for any pre exisiting recommendations
    # in the database.
    recommendations = get_recommendations_for_user(cur, conn, user_id, False)
    # Close the database cursor and return the connection to the pool.
    cur.close()
    db_pool.putconn(conn)
    # Return formatted recommendations.
    return jsonify(recommendations)


@app.route('/')
def index():
    """
    Flask route to render the login page.

    Returns:

    - Rendered HTML: The 'login.html' template, serving as the application's
      login page.

    This is the default route for the web application, which renders the login
    page.
    It acts as the entry point for users accessing the site.
    """

    return render_template('login.html')


@app.route('/record_interaction', methods=['POST'])
def record_interactions():
    """
    Endpoint for recording user interactions with recommendations in the
    system.

    Returns:

    - JSON response indicating the status of the interaction recording.
    - If the user is not authenticated, returns a 401 Unauthorized error.

    Verifies if the user is authenticated by checking the session.
    Parses the JSON data from the POST request, which includes interaction
    details (user ids, like, dislike, etc.).
    Calls the `record_interaction` function to update the database with these
    interactions.
    """

    # Check if user is authenticated yet.
    if 'user_id' not in session:
        return jsonify({'error': 'User not authenticated'}), 401
    user_id = session['user_id']
    # Get a database connection from the pool and create a cursor.
    conn = db_pool.getconn()
    cur = conn.cursor()

    # Request interaction data.
    interaction_data = request.json
    interaction_data['userId'] = user_id

    # Record interaction in DB.
    response = record_interaction(interaction_data, cur, conn)
    # Close the database cursor and return the connection to the pool.
    cur.close()
    db_pool.putconn(conn)

    return response


@app.route('/edit-profile', methods=['GET'])
def edit_profile():
    """
    Route to render the profile editing page for the authenticated user.

    Returns:

    - Rendered HTML: The profile editing page populated with the current
      user's data.

    Checks if the user is authenticated and redirects to the login page if not.
    Retrieves the current user's data from the database
    (using "get_user_data").
    Renders the profile editing template with the retrieved user data.
    """

    # Check if user is authenticated yet.
    if 'user_id' not in session:
        return redirect(url_for('login'))
    # Get a database connection from the pool and create a cursor.
    conn = db_pool.getconn()
    cur = conn.cursor()

    # Fetch user data from the database based on user_id.
    user_data = get_user_data(cur, session['user_id'])
    # Close the database cursor and return the connection to the pool.
    cur.close()
    db_pool.putconn(conn)

    return render_template('edit.html', user_data=user_data)


@app.route('/update_user', methods=['POST'])
def update_user():
    """
    Endpoint for updating the user's profile information.

    Returns:

    - Redirect: To the user's recommendations page after the profile is
      updated.

    Calls `update_user_data` to process the form data submitted by the user
    and update their profile in the database.
    Redirects the user to the recommendations page upon successful update.
    """

    # Get a database connection from the pool.
    conn = db_pool.getconn()
    # FUnction to handle the updating of user data in the db.
    user_id = update_user_data(conn)
    # Return the connection to the pool.
    db_pool.putconn(conn)

    return redirect(url_for('show_recommendations', user_id=user_id))


@app.route('/view-recommendations', methods=['GET'])
def show_recommendations():
    """
    Route to display recommendations for the authenticated user.

    Returns:

    - Rendered HTML: Recommendations page for the authenticated user.
    - Redirects to the login page if the user is not authenticated.

    Verifies if the user is logged in and has a valid session.
    Renders the recommendations template for the logged-in user.
    """

    # Check if user is authenticated yet.
    if 'user_id' in session:
        user_id = session['user_id']
        # Get a database connection from the pool and create a cursor.
        conn = db_pool.getconn()
        cur = conn.cursor()
        # Call function to recieve user isochrone in order to display on the
        # front end.
        isochrone_data, latitude, longitude = get_user_isochrone_data(
            cur, user_id)
        # Close the database cursor and return the connection to the pool.
        cur.close()
        db_pool.putconn(conn)
        return render_template(
            'recommendations.html',
            userid=user_id,
            isochrone_data=isochrone_data,
            latitude=latitude,
            longitude=longitude)
    else:
        return redirect(url_for('login'))


@app.route('/api/matches', methods=['GET'])
def api_matches():
    """
    API endpoint to fetch match recommendations for the authenticated user.

    Returns:

    - JSON: Response containing a list of matches for the authenticated user.
    - Redirects to the login page if the user is not authenticated.

    Verifies if the user is authenticated.
    Calls `get_matches` to retrieve the user's match recommendations from the
    database.
    Returns a JSON response containing the user's match recommendations.
    """

    # Check if user is authenticated yet.
    if 'user_id' not in session:
        return redirect(url_for('login'))
    user_id = session['user_id']
    # Get a database connection from the pool and create a cursor.
    conn = db_pool.getconn()
    cur = conn.cursor()
    # FUnction call to recieve matches and match data required for the front.
    # end
    matches = get_matches(cur, user_id)
    # Close the database cursor and return the connection to the pool.
    cur.close()
    db_pool.putconn(conn)

    return matches


@app.route('/view-matches', methods=['GET'])
def show_matches():
    """
    Route to display match recommendations for the authenticated user.

    Returns:

    - Rendered HTML: Match recommendations page for the authenticated user.
    - Redirects to the login page if the user is not authenticated.

    Verifies if the user is logged in and has a valid session.
    Renders the matches template for the logged-in user.
    """

    # Check if user is authenticated yet if not send them to the login page,
    # if yes then send them to the matches page.
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('matches.html')


@app.route('/create-account')
def create_account():
    """
    Route to render the account creation page.

    Returns:

    - Rendered HTML: The signup page for new users.

    Checks if the user's Firebase UID is in the session and redirects to the
    login page if not.
    Redirects to recommendations if the user has already signed up.
    Renders the account creation page if the user has not signed up.
    """

    # Check if user is authenticated yet.
    if 'firebase_uid' not in session:
        return redirect(url_for('login'))
    # If user already has an account skip account creation and display main
    # page.
    if 'user_id' in session:
        return redirect(url_for('show_recommendations'))
    return render_template('signup.html')


@app.route('/delete-account', methods=['POST'])
def delete_account():
    """
    Endpoint for deleting the authenticated user's account.

    Returns:

    - Redirect: To the account creation page after account deletion.
    - If not authenticated, redirects to the login page.

    Verifies if the user is authenticated.
    Calls `account_deletion` to remove the user's data from the database.
    Clears the session and redirects to the account creation page upon
    successful deletion.
    """
    # Check if user is authenticated yet.
    if 'user_id' in session:
        user_id = session['user_id']
        # Get a database connection from the pool and create a cursor.
        conn = db_pool.getconn()
        cur = conn.cursor()
        # Handles the deleting of user information from the database.
        account_deletion(user_id, conn, cur)
        # Close the database cursor and return the connection to the pool.
        cur.close()
        db_pool.putconn(conn)
        session.clear()  # This clears all data in the session.
        return redirect(url_for('create_account'))
    else:
        return redirect(url_for('login'))


@app.route('/login')
def login():
    """
    Route to render the login page.

    Renders and returns the login template.

    Returns:

    - Rendered HTML: The login page of the application.

    """

    return render_template('login.html')


# Initialize Firebase Admin SDK with the specified service account
# certificate for server-side operations.
cred = credentials.Certificate(
    "web/static/scripts/additional/" +
    "redwood-f9f87-firebase-adminsdk-w4dk2-c53a064263.json")
# Initialize the Firebase app with the specified credentials.
firebase_admin.initialize_app(cred)


@app.route('/verify-token', methods=['POST'])
def verify_token():
    """
    Endpoint to verify the Firebase token for user authentication.

    Returns:

    - JSON: Response with success status and redirection URL.

    Parses the ID token from the POST request.
    Verifies the token using Firebase authentication.
    Updates the session with the Firebase UID and checks if the user exists in
    the database.
    Redirects the user based on their authentication status.
    """

    # Extract the ID token from the incoming request.
    id_token = request.json.get('token')
    # Verify the ID token using Firebase Admin SDK to authenticate the user.
    decoded_token = auth.verify_id_token(id_token)
    # Extract the unique Firebase user ID from the decoded token.
    firebase_uid = decoded_token['uid']
    # Store the Firebase UID in the session for later use.
    session['firebase_uid'] = firebase_uid
    # Get a database connection from the pool and create a cursor.
    conn = db_pool.getconn()
    cur = conn.cursor()

    # Check if user exists in the database.
    user_id = check_user_exists(cur, firebase_uid)

    # Close the database cursor and return the connection to the pool.
    cur.close()
    db_pool.putconn(conn)

    if user_id:
        # If a user_id was found, store it in the session and redirect to
        # recommendations.
        session['user_id'] = user_id
        return jsonify({'status': 'success', 'redirect': url_for(
            'show_recommendations', user_id=user_id)})
    else:
        # If no user_id was found, assume it's a new user and redirect to
        # account creation.
        return jsonify({'status': 'new_user',
                        'redirect': url_for('create_account')})


@app.route('/logout')
def logout():
    """
    Route to handle user logout.

    Returns:

    - Redirect: To the login page.

    Clears the user session to log out the user.
    Redirects to the login page after logout.
    """

    session.clear()  # This clears all data in the session.
    return redirect(url_for('login'))


@app.route('/report', methods=['POST'])
def report():
    """
    Endpoint for users to report other users or interactions.

    Returns:

    - JSON: Response indicating the status of the report submission.

    Verifies if the user is authenticated.
    Processes the report details from the POST request.
    Calls `record_report` to log the report in the database.
    Returns a JSON response indicating the result of the report process.
    """

    # Check if user is authenticated yet.
    if 'user_id' not in session:
        return jsonify({'error': 'User not authenticated'}), 401
    # Retrieve the user_id from the session.
    user_id = session['user_id']
    # Extract the report data from the request body.
    report_data = request.json
    # Get a database connection from the pool and create a cursor.
    conn = db_pool.getconn()
    cur = conn.cursor()
    # Record the report in the database, with the last parameter indicating
    # it's not a match report.
    response = record_report(report_data, user_id, cur, conn, False)
    # Close the database cursor and return the connection to the pool.
    cur.close()
    db_pool.putconn(conn)
    # Return the response from recording the report.
    return response


@app.route('/report_match', methods=['POST'])
def report_match():
    """
    Endpoint for users to report matches.

    Returns:

    - JSON: Response indicating the status of the match report submission.

    Similar to `/report`, but specifically handles reporting of matches.
    Verifies authentication, processes the report, and logs it in the database.
    """

    # Check if user is authenticated yet.
    if 'user_id' not in session:
        return jsonify({'error': 'User not authenticated'}), 401
    # Retrieve the user_id from the session.
    user_id = session['user_id']
    # Extract the report data from the request body.
    report_data = request.json
    # Get a database connection from the pool and create a cursor.
    conn = db_pool.getconn()
    cur = conn.cursor()
    # Record the match report in the database, with the last parameter
    # indicating it's a match report.
    response = record_report(report_data, user_id, cur, conn, True)
    # Close the database cursor and return the connection to the pool.
    cur.close()
    db_pool.putconn(conn)
    # Return the response from recording the match report.
    return response


@app.route('/remove_match', methods=['POST'])
def remove_match():
    """
    Endpoint to remove a match from the user's list.

    Returns:

    - JSON: Response indicating the status of the match removal.

    Checks if the user is authenticated.
    Processes the removal request and updates the database to reflect the
    match removal by calling "remove_matches".
    Returns a JSON response indicating the result of the removal process.
    """

    # Check if user is authenticated yet.
    if 'user_id' not in session:
        return jsonify({'error': 'User not authenticated'}), 401
    user_id = session['user_id']
    # Retrieve the id of the user who is being removed from matches.
    removed_id = request.json
    # Get a database connection from the pool and create a cursor.
    conn = db_pool.getconn()
    cur = conn.cursor()
    # This function handles the logic of removing the matches.
    response = remove_matches(removed_id["id"], user_id, cur, conn)
    # Close the database cursor and return the connection to the pool.
    cur.close()
    db_pool.putconn(conn)

    return response


@app.route('/images/<requested_id>')
def image(requested_id):
    """
    Serves a pre-signed URL for an image stored in S3, allowing for secure,
    temporary access to the image.

    This endpoint checks if the user requesting the image is authenticated by
    verifying the presence of 'user_id' in the session.
    If the user is authenticated, it generates a pre-signed URL for the
    requested image from an S3 bucket, which is valid for a limited time.
    The client is then redirected to this pre-signed URL to directly access
    the image.

    Args:

    - requested_id (str): The ID of the user who's profile picture has been
      requested for viewing, used to construct the object name in the S3 bucket.

    Returns:

    - A redirect to the pre-signed URL of the image if the user is
      authenticated and authorized.
    - A JSON response with an 'Unauthorized' error message and a 401 status
      code if the user is not authenticated.
    """

    # Check if user is authenticated and authorized to see the image.
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # If user is authorized, generate a pre-signed URL.
    # Configure the S3 client with the specified endpoint URL, access keys,
    # and region.
    s3_client = boto3.client(
        's3',
        endpoint_url='https://s3.eu-west-2.amazonaws.com',
        aws_access_key_id=os.environ.get('aws_access_key_id'),
        aws_secret_access_key=os.environ.get('aws_secret_access_key'),
        config=boto3.session.Config(signature_version='s3v4'),
        region_name='eu-west-2'
    )
    # Define the bucket name and object name for the S3 object to be retrieved.
    bucket_name = 'renting-prototype'
    object_name = f'profile_picture_{requested_id}.jpg'

    # Generate the presigned URL for get_object.
    presigned_url = s3_client.generate_presigned_url('get_object', Params={
        'Bucket': bucket_name,
        'Key': object_name,
    }, ExpiresIn=300)
    # Redirect the client to the presigned URL, allowing them to directly
    # access the image.
    return redirect(presigned_url)
