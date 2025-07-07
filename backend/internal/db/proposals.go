package db

import (
	"database/sql"
	"fmt"

	"githib.com/jfreeland/mldegrees/backend/api/internal/models"
)

// CreateProgramProposal creates a new program change proposal
func (db *DB) CreateProgramProposal(userID int, req *models.ProgramProposalRequest) (*models.ProgramProposal, error) {
	query := `
		INSERT INTO program_proposals (
			program_id, user_id, proposed_name, proposed_description, proposed_degree_type,
			proposed_country, proposed_city, proposed_state, proposed_url, proposed_cost, reason
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, program_id, user_id, proposed_name, proposed_description, proposed_degree_type,
		          proposed_country, proposed_city, proposed_state, proposed_url, proposed_cost, reason, status,
		          admin_notes, reviewed_by, reviewed_at, created_at, updated_at
	`

	var proposal models.ProgramProposal
	var proposedName, proposedDescription, proposedDegreeType, proposedCountry, proposedCity, proposedState, proposedURL, proposedCost sql.NullString
	var adminNotes sql.NullString
	var reviewedBy sql.NullInt64
	var reviewedAt sql.NullTime

	err := db.QueryRow(query, req.ProgramID, userID, req.ProposedName, req.ProposedDescription,
		req.ProposedDegreeType, req.ProposedCountry, req.ProposedCity, req.ProposedState,
		req.ProposedURL, req.ProposedCost, req.Reason).Scan(
		&proposal.ID, &proposal.ProgramID, &proposal.UserID, &proposedName, &proposedDescription,
		&proposedDegreeType, &proposedCountry, &proposedCity, &proposedState, &proposedURL, &proposedCost,
		&proposal.Reason, &proposal.Status, &adminNotes, &reviewedBy, &reviewedAt,
		&proposal.CreatedAt, &proposal.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("creating program proposal: %w", err)
	}

	// Handle nullable fields
	if proposedName.Valid {
		proposal.ProposedName = &proposedName.String
	}
	if proposedDescription.Valid {
		proposal.ProposedDescription = &proposedDescription.String
	}
	if proposedDegreeType.Valid {
		proposal.ProposedDegreeType = &proposedDegreeType.String
	}
	if proposedCountry.Valid {
		proposal.ProposedCountry = &proposedCountry.String
	}
	if proposedCity.Valid {
		proposal.ProposedCity = &proposedCity.String
	}
	if proposedState.Valid {
		proposal.ProposedState = &proposedState.String
	}
	if proposedURL.Valid {
		proposal.ProposedURL = &proposedURL.String
	}
	if proposedCost.Valid {
		proposal.ProposedCost = &proposedCost.String
	}
	if adminNotes.Valid {
		proposal.AdminNotes = &adminNotes.String
	}
	if reviewedBy.Valid {
		reviewedByInt := int(reviewedBy.Int64)
		proposal.ReviewedBy = &reviewedByInt
	}
	if reviewedAt.Valid {
		proposal.ReviewedAt = &reviewedAt.Time
	}

	return &proposal, nil
}

// GetProgramProposals returns program proposals with optional status filter
func (db *DB) GetProgramProposals(status string) ([]models.ProgramProposal, error) {
	query := `
		SELECT
			pp.id, pp.program_id, pp.user_id, pp.proposed_name, pp.proposed_description,
			pp.proposed_degree_type, pp.proposed_country, pp.proposed_city, pp.proposed_state,
			pp.proposed_url, pp.proposed_cost, pp.reason, pp.status, pp.admin_notes, pp.reviewed_by,
			pp.reviewed_at, pp.created_at, pp.updated_at,
			u.name as user_name, u.email as user_email,
			p.name as program_name, univ.name as university_name,
			reviewer.name as reviewer_name
		FROM program_proposals pp
		JOIN users u ON pp.user_id = u.id
		JOIN programs p ON pp.program_id = p.id
		JOIN universities univ ON p.university_id = univ.id
		LEFT JOIN users reviewer ON pp.reviewed_by = reviewer.id
		WHERE pp.status = $1
		ORDER BY pp.created_at DESC
	`

	rows, err := db.Query(query, status)
	if err != nil {
		return nil, fmt.Errorf("querying program proposals: %w", err)
	}
	defer rows.Close()

	var proposals []models.ProgramProposal
	for rows.Next() {
		var proposal models.ProgramProposal
		var proposedName, proposedDescription, proposedDegreeType, proposedCountry, proposedCity, proposedState, proposedURL, proposedCost sql.NullString
		var adminNotes sql.NullString
		var reviewedBy sql.NullInt64
		var reviewedAt sql.NullTime
		var reviewerName sql.NullString

		err := rows.Scan(
			&proposal.ID, &proposal.ProgramID, &proposal.UserID, &proposedName, &proposedDescription,
			&proposedDegreeType, &proposedCountry, &proposedCity, &proposedState, &proposedURL, &proposedCost,
			&proposal.Reason, &proposal.Status, &adminNotes, &reviewedBy, &reviewedAt,
			&proposal.CreatedAt, &proposal.UpdatedAt,
			&proposal.UserName, &proposal.UserEmail, &proposal.ProgramName, &proposal.UniversityName,
			&reviewerName,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning program proposal: %w", err)
		}

		// Handle nullable fields
		if proposedName.Valid {
			proposal.ProposedName = &proposedName.String
		}
		if proposedDescription.Valid {
			proposal.ProposedDescription = &proposedDescription.String
		}
		if proposedDegreeType.Valid {
			proposal.ProposedDegreeType = &proposedDegreeType.String
		}
		if proposedCountry.Valid {
			proposal.ProposedCountry = &proposedCountry.String
		}
		if proposedCity.Valid {
			proposal.ProposedCity = &proposedCity.String
		}
		if proposedState.Valid {
			proposal.ProposedState = &proposedState.String
		}
		if proposedURL.Valid {
			proposal.ProposedURL = &proposedURL.String
		}
		if proposedCost.Valid {
			proposal.ProposedCost = &proposedCost.String
		}
		if adminNotes.Valid {
			proposal.AdminNotes = &adminNotes.String
		}
		if reviewedBy.Valid {
			reviewedByInt := int(reviewedBy.Int64)
			proposal.ReviewedBy = &reviewedByInt
		}
		if reviewedAt.Valid {
			proposal.ReviewedAt = &reviewedAt.Time
		}
		if reviewerName.Valid {
			proposal.ReviewerName = reviewerName.String
		}

		proposals = append(proposals, proposal)
	}

	return proposals, nil
}

// ReviewProgramProposal approves or rejects a program proposal and optionally applies changes
func (db *DB) ReviewProgramProposal(proposalID, reviewerID int, action string, adminNotes *string) error {
	if action != "approve" && action != "reject" {
		return fmt.Errorf("invalid action: %s", action)
	}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("beginning transaction: %w", err)
	}
	defer tx.Rollback()

	// Get the proposal details
	var proposal models.ProgramProposal
	var proposedName, proposedDescription, proposedDegreeType, proposedCountry, proposedCity, proposedState, proposedURL, proposedCost sql.NullString

	query := `
		SELECT program_id, proposed_name, proposed_description, proposed_degree_type,
		       proposed_country, proposed_city, proposed_state, proposed_url, proposed_cost
		FROM program_proposals
		WHERE id = $1 AND status = 'pending'
	`

	err = tx.QueryRow(query, proposalID).Scan(
		&proposal.ProgramID, &proposedName, &proposedDescription, &proposedDegreeType,
		&proposedCountry, &proposedCity, &proposedState, &proposedURL, &proposedCost,
	)
	if err == sql.ErrNoRows {
		return fmt.Errorf("proposal not found or already reviewed")
	}
	if err != nil {
		return fmt.Errorf("getting proposal: %w", err)
	}

	// Handle nullable fields
	if proposedName.Valid {
		proposal.ProposedName = &proposedName.String
	}
	if proposedDescription.Valid {
		proposal.ProposedDescription = &proposedDescription.String
	}
	if proposedDegreeType.Valid {
		proposal.ProposedDegreeType = &proposedDegreeType.String
	}
	if proposedCountry.Valid {
		proposal.ProposedCountry = &proposedCountry.String
	}
	if proposedCity.Valid {
		proposal.ProposedCity = &proposedCity.String
	}
	if proposedState.Valid {
		proposal.ProposedState = &proposedState.String
	}
	if proposedURL.Valid {
		proposal.ProposedURL = &proposedURL.String
	}
	if proposedCost.Valid {
		proposal.ProposedCost = &proposedCost.String
	}

	// If approved, apply the changes to the program
	if action == "approve" {
		updateQuery := "UPDATE programs SET updated_at = CURRENT_TIMESTAMP"
		var updateArgs []interface{}
		argIndex := 1

		if proposal.ProposedName != nil {
			updateQuery += fmt.Sprintf(", name = $%d", argIndex)
			updateArgs = append(updateArgs, *proposal.ProposedName)
			argIndex++
		}
		if proposal.ProposedDescription != nil {
			updateQuery += fmt.Sprintf(", description = $%d", argIndex)
			updateArgs = append(updateArgs, *proposal.ProposedDescription)
			argIndex++
		}
		if proposal.ProposedDegreeType != nil {
			updateQuery += fmt.Sprintf(", degree_type = $%d", argIndex)
			updateArgs = append(updateArgs, *proposal.ProposedDegreeType)
			argIndex++
		}
		if proposal.ProposedCountry != nil {
			updateQuery += fmt.Sprintf(", country = $%d", argIndex)
			updateArgs = append(updateArgs, *proposal.ProposedCountry)
			argIndex++
		}
		if proposal.ProposedCity != nil {
			updateQuery += fmt.Sprintf(", city = $%d", argIndex)
			updateArgs = append(updateArgs, *proposal.ProposedCity)
			argIndex++
		}
		if proposal.ProposedState != nil {
			updateQuery += fmt.Sprintf(", state = $%d", argIndex)
			updateArgs = append(updateArgs, *proposal.ProposedState)
			argIndex++
		}
		if proposal.ProposedURL != nil {
			updateQuery += fmt.Sprintf(", url = $%d", argIndex)
			updateArgs = append(updateArgs, *proposal.ProposedURL)
			argIndex++
		}
		if proposal.ProposedCost != nil {
			updateQuery += fmt.Sprintf(", cost = $%d", argIndex)
			updateArgs = append(updateArgs, *proposal.ProposedCost)
			argIndex++
		}

		updateQuery += fmt.Sprintf(" WHERE id = $%d", argIndex)
		updateArgs = append(updateArgs, proposal.ProgramID)

		_, err = tx.Exec(updateQuery, updateArgs...)
		if err != nil {
			return fmt.Errorf("updating program: %w", err)
		}
	}

	// Update the proposal status
	updateProposalQuery := `
		UPDATE program_proposals
		SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, admin_notes = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
	`

	// Convert action to proper status
	var status string
	if action == "approve" {
		status = "approved"
	} else if action == "reject" {
		status = "rejected"
	}

	_, err = tx.Exec(updateProposalQuery, status, reviewerID, adminNotes, proposalID)
	if err != nil {
		return fmt.Errorf("updating proposal status: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("committing transaction: %w", err)
	}

	return nil
}

// GetUserProgramProposals returns all proposals created by a specific user
func (db *DB) GetUserProgramProposals(userID int) ([]models.ProgramProposal, error) {
	query := `
		SELECT
			pp.id, pp.program_id, pp.user_id, pp.proposed_name, pp.proposed_description,
			pp.proposed_degree_type, pp.proposed_country, pp.proposed_city, pp.proposed_state,
			pp.proposed_url, pp.proposed_cost, pp.reason, pp.status, pp.admin_notes, pp.reviewed_by,
			pp.reviewed_at, pp.created_at, pp.updated_at,
			p.name as program_name, univ.name as university_name,
			reviewer.name as reviewer_name
		FROM program_proposals pp
		JOIN programs p ON pp.program_id = p.id
		JOIN universities univ ON p.university_id = univ.id
		LEFT JOIN users reviewer ON pp.reviewed_by = reviewer.id
		WHERE pp.user_id = $1
		ORDER BY pp.created_at DESC
	`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("querying user program proposals: %w", err)
	}
	defer rows.Close()

	var proposals []models.ProgramProposal
	for rows.Next() {
		var proposal models.ProgramProposal
		var proposedName, proposedDescription, proposedDegreeType, proposedCountry, proposedCity, proposedState, proposedURL, proposedCost sql.NullString
		var adminNotes sql.NullString
		var reviewedBy sql.NullInt64
		var reviewedAt sql.NullTime
		var reviewerName sql.NullString

		err := rows.Scan(
			&proposal.ID, &proposal.ProgramID, &proposal.UserID, &proposedName, &proposedDescription,
			&proposedDegreeType, &proposedCountry, &proposedCity, &proposedState, &proposedURL, &proposedCost,
			&proposal.Reason, &proposal.Status, &adminNotes, &reviewedBy, &reviewedAt,
			&proposal.CreatedAt, &proposal.UpdatedAt,
			&proposal.ProgramName, &proposal.UniversityName, &reviewerName,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning user program proposal: %w", err)
		}

		// Handle nullable fields
		if proposedName.Valid {
			proposal.ProposedName = &proposedName.String
		}
		if proposedDescription.Valid {
			proposal.ProposedDescription = &proposedDescription.String
		}
		if proposedDegreeType.Valid {
			proposal.ProposedDegreeType = &proposedDegreeType.String
		}
		if proposedCountry.Valid {
			proposal.ProposedCountry = &proposedCountry.String
		}
		if proposedCity.Valid {
			proposal.ProposedCity = &proposedCity.String
		}
		if proposedState.Valid {
			proposal.ProposedState = &proposedState.String
		}
		if proposedURL.Valid {
			proposal.ProposedURL = &proposedURL.String
		}
		if proposedCost.Valid {
			proposal.ProposedCost = &proposedCost.String
		}
		if adminNotes.Valid {
			proposal.AdminNotes = &adminNotes.String
		}
		if reviewedBy.Valid {
			reviewedByInt := int(reviewedBy.Int64)
			proposal.ReviewedBy = &reviewedByInt
		}
		if reviewedAt.Valid {
			proposal.ReviewedAt = &reviewedAt.Time
		}
		if reviewerName.Valid {
			proposal.ReviewerName = reviewerName.String
		}

		proposals = append(proposals, proposal)
	}

	return proposals, nil
}

// DeleteUserProgramProposal deletes a proposal if it belongs to the user and is still pending
func (db *DB) DeleteUserProgramProposal(proposalID, userID int) error {
	query := `
		DELETE FROM program_proposals
		WHERE id = $1 AND user_id = $2 AND status = 'pending'
	`

	result, err := db.Exec(query, proposalID, userID)
	if err != nil {
		return fmt.Errorf("deleting program proposal: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("checking rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("proposal not found, not owned by user, or already reviewed")
	}

	return nil
}

// UpdateUserProgramProposal updates a proposal if it belongs to the user and is still pending
func (db *DB) UpdateUserProgramProposal(proposalID, userID int, req *models.ProgramProposalRequest) (*models.ProgramProposal, error) {
	// First check if the proposal exists, belongs to the user, and is still pending
	var existingProposal models.ProgramProposal
	checkQuery := `
		SELECT id, program_id, user_id, status
		FROM program_proposals
		WHERE id = $1 AND user_id = $2 AND status = 'pending'
	`

	err := db.QueryRow(checkQuery, proposalID, userID).Scan(
		&existingProposal.ID, &existingProposal.ProgramID, &existingProposal.UserID, &existingProposal.Status,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("proposal not found, not owned by user, or already reviewed")
	}
	if err != nil {
		return nil, fmt.Errorf("checking proposal ownership: %w", err)
	}

	// Validate that at least one proposed change is provided
	if req.ProposedName == nil && req.ProposedDescription == nil &&
		req.ProposedDegreeType == nil && req.ProposedCountry == nil &&
		req.ProposedCity == nil && req.ProposedState == nil && req.ProposedURL == nil && req.ProposedCost == nil {
		return nil, fmt.Errorf("at least one proposed change must be provided")
	}

	// Update the proposal
	updateQuery := `
		UPDATE program_proposals
		SET proposed_name = $1, proposed_description = $2, proposed_degree_type = $3,
		    proposed_country = $4, proposed_city = $5, proposed_state = $6,
		    proposed_url = $7, proposed_cost = $8, reason = $9, updated_at = CURRENT_TIMESTAMP
		WHERE id = $10 AND user_id = $11
		RETURNING id, program_id, user_id, proposed_name, proposed_description, proposed_degree_type,
		          proposed_country, proposed_city, proposed_state, proposed_url, proposed_cost, reason, status,
		          admin_notes, reviewed_by, reviewed_at, created_at, updated_at
	`

	var proposal models.ProgramProposal
	var proposedName, proposedDescription, proposedDegreeType, proposedCountry, proposedCity, proposedState, proposedURL, proposedCost sql.NullString
	var adminNotes sql.NullString
	var reviewedBy sql.NullInt64
	var reviewedAt sql.NullTime

	err = db.QueryRow(updateQuery, req.ProposedName, req.ProposedDescription,
		req.ProposedDegreeType, req.ProposedCountry, req.ProposedCity, req.ProposedState,
		req.ProposedURL, req.ProposedCost, req.Reason, proposalID, userID).Scan(
		&proposal.ID, &proposal.ProgramID, &proposal.UserID, &proposedName, &proposedDescription,
		&proposedDegreeType, &proposedCountry, &proposedCity, &proposedState, &proposedURL, &proposedCost,
		&proposal.Reason, &proposal.Status, &adminNotes, &reviewedBy, &reviewedAt,
		&proposal.CreatedAt, &proposal.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("updating program proposal: %w", err)
	}

	// Handle nullable fields
	if proposedName.Valid {
		proposal.ProposedName = &proposedName.String
	}
	if proposedDescription.Valid {
		proposal.ProposedDescription = &proposedDescription.String
	}
	if proposedDegreeType.Valid {
		proposal.ProposedDegreeType = &proposedDegreeType.String
	}
	if proposedCountry.Valid {
		proposal.ProposedCountry = &proposedCountry.String
	}
	if proposedCity.Valid {
		proposal.ProposedCity = &proposedCity.String
	}
	if proposedState.Valid {
		proposal.ProposedState = &proposedState.String
	}
	if proposedURL.Valid {
		proposal.ProposedURL = &proposedURL.String
	}
	if proposedCost.Valid {
		proposal.ProposedCost = &proposedCost.String
	}
	if adminNotes.Valid {
		proposal.AdminNotes = &adminNotes.String
	}
	if reviewedBy.Valid {
		reviewedByInt := int(reviewedBy.Int64)
		proposal.ReviewedBy = &reviewedByInt
	}
	if reviewedAt.Valid {
		proposal.ReviewedAt = &reviewedAt.Time
	}

	return &proposal, nil
}
