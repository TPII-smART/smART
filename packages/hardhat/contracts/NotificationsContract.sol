// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NotificationsContract {
    event NotificationsRemoved(string[] ids, address user);

    function removeNotifications(string[] calldata ids) external {
        emit NotificationsRemoved(ids, msg.sender);
    }
}