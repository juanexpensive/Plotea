from dataclasses import dataclass


@dataclass
class ReviewVoteSummary:
    review_id: int
    helpful_votes: int
    has_voted: bool
