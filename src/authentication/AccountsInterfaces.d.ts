export interface Account {
    /**
     * Identifier for an Account
     */
    accountId?: string;
    /**
     * Name for an account
     */
    accountName?: string;
    /**
     * Owner of account
     */
    accountOwner?: string;
    /**
     * Current account status
     */
    accountStatus?: AccountStatus;
    /**
     * Type of account: Personal, Organization
     */
    accountType?: AccountType;
    /**
     * Uri for an account
     */
    accountUri?: string;
    /**
     * Who created the account
     */
    createdBy?: string;
    /**
     * Date account was created
     */
    createdDate?: Date;
    hasMoved?: boolean;
    /**
     * Identity of last person to update the account
     */
    lastUpdatedBy?: string;
    /**
     * Date account was last updated
     */
    lastUpdatedDate?: Date;
    /**
     * Namespace for an account
     */
    namespaceId?: string;
    newCollectionId?: string;
    /**
     * Organization that created the account
     */
    organizationName?: string;
    /**
     * Extended properties
     */
    properties?: any;
    /**
     * Reason for current status
     */
    statusReason?: string;
}

export enum AccountStatus {
    None = 0,
    /**
     * This hosting account is active and assigned to a customer.
     */
    Enabled = 1,
    /**
     * This hosting account is disabled.
     */
    Disabled = 2,
    /**
     * This account is part of deletion batch and scheduled for deletion.
     */
    Deleted = 3,
    /**
     * This account is not mastered locally and has physically moved.
     */
    Moved = 4,
}

export enum AccountType {
    Personal = 0,
    Organization = 1,
}
