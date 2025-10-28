// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

enum DeliverableState {
    Pending, // 0 - Awaiting client review
    Approved, // 1 - Approved by client
    Rejected, // 2 - Rejected by client, needs resubmission
    Disputed // 3 - Under dispute resolution
}

struct DeliverableInfo {
    string resource;
    string parsedResource; // resource in the format compatible with Kleros court
    uint256 uploadedAt;
    string submissionComment;
    string clientResponse;
    uint256 responseTimestamp;
    DeliverableState state;
    bool isLink; // Whether the file is a link or an uploaded file
    uint256 deliverableGroupId; // Group id for identifying deliverables from the same group
}

struct DeliverableParams {
    string resource;
    string parsedResource;
    string submissionComment;
    bool isLink;
}
