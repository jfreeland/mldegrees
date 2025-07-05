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
	Status         string    `json:"status"`
	Visibility     string    `json:"visibility"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	UniversityName string    `json:"university_name,omitempty"`
	Rating         int       `json:"rating,omitempty"`
	UserVote       *int      `json:"user_vote,omitempty"`
}

type Vote struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	ProgramID int       `json:"program_id"`
	Vote      int       `json:"vote"` // -1 or 1
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type VoteRequest struct {
	ProgramID int `json:"program_id"`
	Vote      int `json:"vote"`
}

type ProgramFilters struct {
	DegreeType string `json:"degree_type"`
	Country    string `json:"country"`
	City       string `json:"city"`
	State      string `json:"state"`
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
}

type AdminProgramAction struct {
	ProgramID int    `json:"program_id"`
	Action    string `json:"action"` // "approve" or "reject"
}
