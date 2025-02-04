import { faSearch, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Alert, Button } from "react-bootstrap";

const NoMatchesContent = ({ onReset }: { onReset: () => void }) => (
    <Alert className="text-center p-5 bg-body-tertiary border">
        <div className="mb-3">
            <FontAwesomeIcon icon={faSearch} className="text-secondary fa-3x" />
        </div>
        <h4 className="text-body">No Matches Found</h4>
        <p className="text-body-secondary mb-4">
            No funding sources match your search criteria. Try adjusting your filters.
        </p>
        <Button variant="secondary" onClick={onReset}>
            <FontAwesomeIcon icon={faXmark} className="me-2" />
            Clear All Filters
        </Button>
    </Alert>
);

export default NoMatchesContent;