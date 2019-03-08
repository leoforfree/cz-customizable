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
      subject?: string,
      body?: string,
      breaking?: string,
      footer?: string,
      confirmCommit?: string,
    };
    allowCustomScopes?: boolean;
    allowBreakingChanges?: string[];
    appendBranchNameToCommitMessage?: boolean;
    skipQuestions?: string[];
    breakingPrefix?: string;
    footerPrefix?: string;
    subjectLimit?: number;
  }
}
