package models

import (
	"time"
)

type User struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	GoogleID  *string   `json:"google_id,omitempty"`
	GitHubID  *string   `json:"github_id,omitempty"`
	Role      string    `json:"role"` // "user" or "admin"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type University struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type Program struct {
	ID             int       `json:"id"`
	UniversityID   int       `json:"university_id"`
	Name           string    `json:"name"`
	Description    string    `json:"description"`
	DegreeType     string    `json:"degree_type"`
	Country        string    `json:"country"`
	City           string    `json:"city"`
	State          *string   `json:"state,omitempty"`
	URL            *string   `json:"url,omitempty"`
	Cost           string    `json:"cost"`
	Status         string    `json:"status"`
	Visibility     string    `json:"visibility"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	UniversityName string    `json:"university_name,omitempty"`
	AverageRating  float64   `json:"average_rating,omitempty"`
	UserRating     *int      `json:"user_rating,omitempty"`
	UserVote       *int      `json:"user_vote,omitempty"` // Keep for backward compatibility
}

type Vote struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	ProgramID int       `json:"program_id"`
	Vote      int       `json:"vote"` // -1 or 1
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Rating struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	ProgramID int       `json:"program_id"`
	Rating    int       `json:"rating"` // 1-5 scale
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type VoteRequest struct {
	ProgramID int `json:"program_id"`
	Vote      int `json:"vote"`
}

type RatingRequest struct {
	ProgramID int `json:"program_id"`
	Rating    int `json:"rating"` // 1-5 scale
}

type ProgramFilters struct {
	DegreeType string `json:"degree_type"`
	Country    string `json:"country"`
	City       string `json:"city"`
	State      string `json:"state"`
	Cost       string `json:"cost"`
	SortBy     string `json:"sort_by"`    // "rating", "name", "created_at"
	SortOrder  string `json:"sort_order"` // "asc", "desc"
}

type ProposeRequest struct {
	UniversityName string  `json:"university_name"`
	ProgramName    string  `json:"program_name"`
	Description    string  `json:"description"`
	DegreeType     string  `json:"degree_type"`
	Country        string  `json:"country"`
	City           string  `json:"city"`
	State          *string `json:"state,omitempty"`
	URL            *string `json:"url,omitempty"`
	Cost           string  `json:"cost"`
}

type AdminProgramAction struct {
	ProgramID int    `json:"program_id"`
	Action    string `json:"action"` // "approve" or "reject"
}

type ProgramUpdateRequest struct {
	ID             int     `json:"id"`
	UniversityName string  `json:"university_name"`
	Name           string  `json:"name"`
	Description    string  `json:"description"`
	DegreeType     string  `json:"degree_type"`
	Country        string  `json:"country"`
	City           string  `json:"city"`
	State          *string `json:"state,omitempty"`
	URL            *string `json:"url,omitempty"`
	Cost           string  `json:"cost"`
}

type ProgramProposal struct {
	ID                  int        `json:"id"`
	ProgramID           int        `json:"program_id"`
	UserID              int        `json:"user_id"`
	ProposedName        *string    `json:"proposed_name,omitempty"`
	ProposedDescription *string    `json:"proposed_description,omitempty"`
	ProposedDegreeType  *string    `json:"proposed_degree_type,omitempty"`
	ProposedCountry     *string    `json:"proposed_country,omitempty"`
	ProposedCity        *string    `json:"proposed_city,omitempty"`
	ProposedState       *string    `json:"proposed_state,omitempty"`
	ProposedURL         *string    `json:"proposed_url,omitempty"`
	ProposedCost        *string    `json:"proposed_cost,omitempty"`
	Reason              string     `json:"reason"`
	Status              string     `json:"status"`
	AdminNotes          *string    `json:"admin_notes,omitempty"`
	ReviewedBy          *int       `json:"reviewed_by,omitempty"`
	ReviewedAt          *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`

	// Joined fields
	UserName       string `json:"user_name,omitempty"`
	UserEmail      string `json:"user_email,omitempty"`
	ProgramName    string `json:"program_name,omitempty"`
	UniversityName string `json:"university_name,omitempty"`
	ReviewerName   string `json:"reviewer_name,omitempty"`
}

type ProgramProposalRequest struct {
	ProgramID           int     `json:"program_id"`
	ProposedName        *string `json:"proposed_name,omitempty"`
	ProposedDescription *string `json:"proposed_description,omitempty"`
	ProposedDegreeType  *string `json:"proposed_degree_type,omitempty"`
	ProposedCountry     *string `json:"proposed_country,omitempty"`
	ProposedCity        *string `json:"proposed_city,omitempty"`
	ProposedState       *string `json:"proposed_state,omitempty"`
	ProposedURL         *string `json:"proposed_url,omitempty"`
	ProposedCost        *string `json:"proposed_cost,omitempty"`
	Reason              string  `json:"reason"`
}

type ProgramProposalReviewRequest struct {
	ProposalID int     `json:"proposal_id"`
	Action     string  `json:"action"` // "approve" or "reject"
	AdminNotes *string `json:"admin_notes,omitempty"`
}
