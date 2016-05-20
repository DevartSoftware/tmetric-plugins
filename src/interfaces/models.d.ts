declare module Models {

    interface TimeZoneInfo {
        id: string;
        displayName: string;
    }

    interface UserProfile {
        userProfileId: number;
        activeAccountId: number;
        userName: string;
        dateFormat: string;

        /*
         * Time format for specific user.
         * 'H:mm' - 24h format.
         * 'h:mm a' - 12h format.
         */
        timeFormat: string;
        firstWeekDay: number;
        showBreaks: boolean;
        email: string;
        timeZoneInfo: Models.TimeZoneInfo;

        /*
         * This collection defines which service accounts the user can access.
         * Accounts where user is locked are not included in the list.
         */
        accountMembership: Models.AccountMember[];
        isRegistered: boolean;
    }

    interface Account {
        accountId: number;
        accountName: string;
        accountOwnerName: string;
        isPaid: boolean;
    }

    interface AccountMember {
        accountId: number;
        accountMemberId: number;
        account: Models.Account;
        role: ServiceRole;
        isLocked: boolean;
        userProfile: Models.UserProfile;
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
        accountId: number;
        integrationName: string;
        projectStatus: ProjectStatus;
        projectRole: ProjectRole;
        serviceRole: ServiceRole;
    }

    interface WorkTask {
        description: string;
        projectId: number;
        externalIssueId: string;
        integrationId: number;
        relativeIssueUrl: string;
        integrationUrl: string;
    }

    interface Timer {
        isStarted: boolean;
        workTask: WorkTask;
        startTime: string;
        tagsIdentifiers: number[];
        isBillable: boolean;
    }

    interface TimeEntry {
        timeEntryId: number;
        workTask: WorkTask;
        workTaskId: number;
        startTime: string;
        endTime?: string;
        projectName: string;
        tagsIdentifiers?: number[];
    }

    interface Project {
        projectId: number;
        projectName: string;
        accountId: number;
        projectStatus: ProjectStatus;
        isBillable: boolean;
    }

    interface Tag {
        tagId: number;
        accountId: number;
        tagName: string;
    }
}