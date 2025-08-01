// Helper function to check if a string starts with a given prefix
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library StringUtils {
    // Helper function to check if a string starts with a given prefix
    function startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);
        if (prefixBytes.length > strBytes.length) {
            return false;
        }
        for (uint i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) {
                return false;
            }
        }
        return true;
    }

    function contains(string memory str, string memory substr) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory substrBytes = bytes(substr);
        if (substrBytes.length == 0 || substrBytes.length > strBytes.length) {
            return false;
        }
        for (uint i = 0; i <= strBytes.length - substrBytes.length; i++) {
            bool matchFound = true;
            for (uint j = 0; j < substrBytes.length; j++) {
                if (strBytes[i + j] != substrBytes[j]) {
                    matchFound = false;
                    break;
                }
            }
            if (matchFound) {
                return true;
            }
        }
        return false;
    }

    function isValidUrl(string memory url, string memory domain) internal pure returns (bool) {
        return contains(url, ".") &&
            (startsWith(url, string(abi.encodePacked("https://", domain))) ||
            startsWith(url, string(abi.encodePacked("https://www.", domain))) ||
            startsWith(url, domain) ||
            startsWith(url, string(abi.encodePacked("www.", domain))));
    }
}