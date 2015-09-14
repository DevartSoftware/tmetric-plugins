declare module Models {
    interface TimeZoneInfo
    {
        Id: string;
        DisplayName: string;
    }
    
    interface UserProfile {
        UserProfileId: number;
        ActiveAccountId: number;
        UserName: string;
        DateFormat: string;

        /*
         * Time format for specific user.
         * 'H:mm' - 24h format.
         * 'h:mm a' - 12h format.
         */
        TimeFormat: string;
        FirstWeekDay: number;
        ShowBreaks: boolean;
        Email: string;
        TimeZoneInfo: Models.TimeZoneInfo;

        /*
         * This collection defines which service accounts the user can access.
         * Accounts where user is locked are not included in the list.
         */
        AccountMembership: Models.AccountMember[];
        IsRegistered: boolean;
    }

    interface Account {
        AccountId: number;
        AccountName: string;
        AccountOwnerName: string;
    }

    interface AccountMember {
        AccountId: number;
        AccountMemberId: number;
        Account: Models.Account;
        Role: ServiceRole;
        IsLocked: boolean;
        UserProfile: Models.UserProfile;
    }

    interface IntegratedProjectIdentifier {
        serviceUrl: string;
        serviceType: string;
        projectName: string;
    }

    const enum ProjectRole {
        Member,
        Manager
    }

    const enum ProjectStatus {
        Open = 1,
        Closed = 2,
        Archived = 3
    }

    const enum ServiceRole {
        Member,
        ProjectCreator,
        Admin,
        Owner
    }

    interface IntegratedProjectStatus {
        IntegrationName: string;
        ProjectStatus: ProjectStatus;
        ProjectRole: ProjectRole;
        ServiceRole: ServiceRole;
    }

    interface WorkTask {
        Description: string;
        ProjectId: number;
        ExternalIssueId: string;
        IntegrationId: number;
        RelativeIssueUrl: string;
        IntegrationUrl: string;

    }

    interface Timer {
        IsStarted: boolean;
        WorkTask: WorkTask;
        StartTime: string;
    }
    
    interface TimeEntry {
        WorkTask: WorkTask;
        StartTime: string;
        EndTime: string;
        ProjectName: string;
    }    
}