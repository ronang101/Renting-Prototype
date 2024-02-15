# Standard library imports.

# Related third-party imports.
from flask import jsonify

# Local application/library-specific imports.


def record_interaction(interaction_data, cur, conn):
    """
    Records a user interaction with a recommendation in the database.

    Args:

    - interaction_data (dict): Dictionary containing interaction details
      including user ID, recommendation ID, and interaction type.
    - cur: Database cursor object for executing queries.
    - conn: Database connection object.

    Returns:

    - Response: JSON response indicating if there was a match or not.

    This function takes interaction data from a user and records it in the
    database, it also checks if this interaction is a match (mutual likes).
    It handles exceptions and returns a JSON response to indicate the status
    of the operation.
    """

    # Extracting interaction details from the input data.
    user_id = interaction_data['userId']
    recommendation_id = interaction_data['recommendationId']
    interaction_type = interaction_data['interactionType']

    # Record the interaction in the database.
    try:
        # Database operation for recording the interaction.
        cur.execute(
            """INSERT INTO user_base_interactions (user_id1, user_id2,
            interaction_type, interaction_date) VALUES (%s, %s, %s,
            NOW()) ON CONFLICT DO NOTHING;""",
            (user_id, recommendation_id, interaction_type)
        )
        match = 0
        if interaction_type != "disliked":
            cur.execute(
                """SELECT COUNT(*) FROM user_base_interactions WHERE
                user_id1 = %s AND user_id2 = %s AND interaction_type
                IN ('liked', 'superliked')""",
                (recommendation_id, user_id)
            )
            match = cur.fetchone()[0]
        if match:
            cur.execute(
                "INSERT INTO matches (user_id1, user_id2) VALUES (%s, %s)",
                (user_id, recommendation_id)
            )
        conn.commit()

    # Handling any exceptions that occur during database operations
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'match': 0}), 500
    # Returning a successful status response
    return jsonify({'match': match})


def record_report(report_data, user_id, cur, conn, match):
    """
    Records a user report in the database and handles match deletions if
    necessary.

    Args:

    - report_data (dict): Data about the report, including reported user ID
      and reason.
    - user_id (int): ID of the user making the report.
    - cur: Database cursor for executing queries.
    - conn: Database connection object.
    - match (bool): Indicates if there is a match between the reporting and
      reported users.

    Returns:

    - Response: JSON response indicating the result of the operation.
    """

    try:
        # If a match exists, delete interactions and matches involving both
        # users.
        if match:
            cur.execute(
                """DELETE FROM user_base_interactions WHERE user_id1 = %s AND
                user_id2 = %s;""",
                (user_id, report_data["reportedUserId"])
            )
            cur.execute(
                """DELETE FROM matches WHERE (user_id1 = %s AND user_id2 = %s)
                OR (user_id1 = %s AND user_id2 = %s);""",
                (user_id,
                 report_data["reportedUserId"],
                 report_data["reportedUserId"],
                 user_id))
        # Insert a record of the interaction as a 'dislike' and the report
        # details.
        cur.execute(
            """INSERT INTO user_base_interactions (user_id1, user_id2,
            interaction_type, interaction_date) VALUES (%s, %s, %s, NOW())
            ON CONFLICT DO NOTHING;""",
            (user_id, report_data["reportedUserId"], "disliked")
        )
        # Insert the report in the db.
        cur.execute(
            """INSERT INTO user_reports (user_id1, user_id2, report_reason,
            report_date) VALUES (%s, %s, %s, NOW()) ON CONFLICT DO NOTHING;""",
            (user_id, report_data["reportedUserId"], report_data["reason"])
        )
        # Commit the changes to the database.
        conn.commit()
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Error processing report'}), 500
    # Return a success message in JSON format.
    return jsonify({'message': 'Report submitted successfully'}), 200


def remove_matches(removed_id, user_id, cur, conn):
    """
    Removes match records from the database involving the specified users.

    Args:

    - removed_id (int): ID of the user whose matches are to be removed.
    - user_id (int): ID of the user initiating the removal.
    - cur: Database cursor for executing queries.
    - conn: Database connection object.

    Returns:

    - Response: JSON response indicating the result of the operation.
    """

    try:
        # Delete match records involving both specified users.
        cur.execute(
            """DELETE FROM matches WHERE (user_id1 = %s AND user_id2 = %s) OR
            (user_id1 = %s AND user_id2 = %s);""",
            (user_id, removed_id, removed_id, user_id)
        )
        # Commit the changes to the database.
        conn.commit()
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Error processing report'}), 500
    # Return a success message in JSON format.
    return jsonify({'message': 'Report submitted successfully'}), 200
