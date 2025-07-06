#!/usr/bin/env python3
"""
Import university and program data from JSON files into the database.

Usage:
    python import_data.py <json_file>

Environment Variables:
    DATABASE_URL - PostgreSQL connection string
"""

import json
import os
import sys
import logging
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import sql

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DataImporter:
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.conn = None

    def connect(self):
        try:
            self.conn = psycopg2.connect(
                self.database_url,
                cursor_factory=RealDictCursor
            )
            self.conn.autocommit = False
            logger.info("Connected to database successfully")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

    def close(self):
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")

    def find_university_by_name(self, name: str) -> Optional[int]:
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id FROM universities WHERE name = %s",
                    (name,)
                )
                result = cursor.fetchone()
                return result['id'] if result else None
        except Exception as e:
            logger.error(f"Error finding university '{name}': {e}")
            raise

    def create_university(self, name: str) -> int:
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO universities (name) VALUES (%s) RETURNING id",
                    (name,)
                )
                result = cursor.fetchone()
                university_id = result['id']
                logger.info(f"Created university: {name} (ID: {university_id})")
                return university_id
        except Exception as e:
            logger.error(f"Error creating university '{name}': {e}")
            raise

    def get_or_create_university(self, name: str) -> int:
        university_id = self.find_university_by_name(name)
        if university_id:
            logger.info(f"Found existing university: {name} (ID: {university_id})")
            return university_id
        else:
            return self.create_university(name)

    def find_program(self, university_id: int, name: str, degree_type: str) -> Optional[int]:
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id FROM programs WHERE university_id = %s AND name = %s AND degree_type = %s",
                    (university_id, name, degree_type)
                )
                result = cursor.fetchone()
                return result['id'] if result else None
        except Exception as e:
            logger.error(f"Error finding program '{name}': {e}")
            raise

    def create_program(self, program_data: Dict[str, Any], university_id: int) -> int:
        try:
            with self.conn.cursor() as cursor:
                insert_data = {
                    'university_id': university_id,
                    'name': program_data['name'],
                    'description': program_data.get('description'),
                    'degree_type': program_data.get('degree_type', 'unknown'),
                    'country': program_data.get('country', 'United States'),
                    'city': program_data.get('city', ''),
                    'state': program_data.get('state'),
                    'url': program_data.get('url'),
                    'status': program_data.get('status', 'active'),
                    'visibility': program_data.get('visibility', 'pending')
                }

                columns = list(insert_data.keys())
                placeholders = ['%s'] * len(columns)
                values = list(insert_data.values())

                query = sql.SQL("INSERT INTO programs ({}) VALUES ({}) RETURNING id").format(
                    sql.SQL(', ').join(map(sql.Identifier, columns)),
                    sql.SQL(', ').join(sql.SQL(p) for p in placeholders)
                )

                cursor.execute(query, values)
                result = cursor.fetchone()
                program_id = result['id']
                logger.info(f"Created program: {program_data['name']} (ID: {program_id})")
                return program_id
        except Exception as e:
            logger.error(f"Error creating program '{program_data.get('name', 'Unknown')}': {e}")
            raise

    def process_program(self, program_data: Dict[str, Any]) -> None:
        try:
            university_name = program_data.get('university_name')
            if not university_name:
                logger.warning(f"No university_name found for program: {program_data.get('name', 'Unknown')}")
                return

            university_id = self.get_or_create_university(university_name)

            program_name = program_data['name']
            degree_type = program_data.get('degree_type', 'masters')

            existing_program_id = self.find_program(university_id, program_name, degree_type)

            if existing_program_id:
                logger.info(f"Program already exists: {program_name} (ID: {existing_program_id})")
            else:
                self.create_program(program_data, university_id)

        except Exception as e:
            logger.error(f"Error processing program: {e}")
            raise

    def import_from_json(self, json_file_path: str) -> None:
        """Import data from JSON file."""
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            logger.info(f"Loaded {len(data)} entries from {json_file_path}")

            with self.conn:
                processed = 0
                skipped = 0

                for entry in data:
                    try:
                        self.process_program(entry)
                        processed += 1
                    except Exception as e:
                        logger.error(f"Failed to process entry: {e}")
                        skipped += 1
                        continue

                logger.info(f"Import completed: {processed} processed, {skipped} skipped")

        except FileNotFoundError:
            logger.error(f"JSON file not found: {json_file_path}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON format: {e}")
            raise
        except Exception as e:
            logger.error(f"Error during import: {e}")
            raise


def main():
    if len(sys.argv) != 2:
        print("Usage: python import_data.py <json_file>")
        sys.exit(1)

    json_file = sys.argv[1]

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        logger.error("DATABASE_URL environment variable is required")
        sys.exit(1)

    importer = DataImporter(database_url)

    try:
        importer.connect()

        importer.import_from_json(json_file)

        logger.info("Data import completed successfully")

    except Exception as e:
        logger.error(f"Import failed: {e}")
        sys.exit(1)
    finally:
        importer.close()


if __name__ == "__main__":
    main()
