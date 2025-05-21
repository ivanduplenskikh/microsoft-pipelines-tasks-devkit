export namespace AzureDevOps {
    interface AccountCoreAttributesPublicAlias {
        value: string;
    }

    interface AccountCoreAttributes {
        PublicAlias: AccountCoreAttributesPublicAlias;
    }

    export interface Account {
       coreAttributes: AccountCoreAttributes;
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

    export interface OrganizationApiResponse {
        count: number;
        value: Organization[];
    }

    export interface Organizations {
        ownerOrganizations: Organization[];
        memberOrgs: Organization[];
    }

    export interface Organization {
        accountId: string;
        accountName: string;
        accountUri: string;
    }
}