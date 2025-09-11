// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

enum NotificationStatus {
    UNREAD,
    READ,
    DONE
}

contract NotificationsContract {
    // event NotificationsRemoved(string[] ids, address user);
    event ChangeNotificationsStatus(string[] ids, NotificationStatus status, address user);

    function changeNotificationsStatus(string[] calldata ids, NotificationStatus status) external {
        emit ChangeNotificationsStatus(ids, status, msg.sender);
    }

    // function removeNotifications(string[] calldata ids) external {
    //     emit NotificationsRemoved(ids, msg.sender);
    // }
}