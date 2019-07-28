declare module "cz-customizable" {
  export interface Option {
    name: string;
    value?: string;
  }
  export interface Options {
    types: Option[];
    scopes?: Option[];
    scopeOverrides?: { [type: string]: Option[] };
    messages?: {
      type?: string,
      scope?: string,
      customScope?: string,
      ticketNumber?: string,
      omitTicketPrefix?: string,
      subject?: string,
      body?: string,
      breaking?: string,
      footer?: string,
      confirmCommit?: string,
    };

    allowTicketNumber?: boolean;
    isTicketNumberRequired?: boolean;
    ticketNumberPrefix?: string;
    ticketNumberRegExp?: string;
    ticketSeparator?: string;
    allowOmitTicketPrefix?: boolean;

    allowCustomScopes?: boolean;
    allowBreakingChanges?: string[];
    skipQuestions?: string[];
    appendBranchNameToCommitMessage?: boolean;
    breakingPrefix?: string;
    footerPrefix?: string;
    subjectLimit?: number;
  }
}
