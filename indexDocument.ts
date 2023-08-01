export interface Subcategory {
    id: string;
    name: string;
    url: string;
}

export interface Category {
    id?: string;
    name?: string;
    url?: string;
    isprimarycat?: number;
    subcategory?: Subcategory;
}

export interface Subgroup {
    id?: string;
    name?: string;
    url?: string;
    subsubgroup?: Subsubgroup | null;
}

export interface Subsubgroup {
    id?: string;
    name?: string;
    url?: string;
    ordering?: string;
    subsubgroup?: Subsubgroup;
}

export interface Subsubsubgroup {
    id: string;
    name: string;
    url: string;
    ordering: string;
    subsubsubsubgroup: Subsubsubgroup;
}

export interface Subsubsubsubgroup {
    id: string;
    name: string;
    url: string;
    ordering: string;
    subsubsubsubsubgroup: Subsubsubsubgroup;
}

export interface Subsubsubsubsubgroup {
    id: string;
    name: string;
    url: string;
    ordering: string;
    subsubsubsubsubsubgroup: Subsubsubsubsubsubgroup;
}

export interface Subsubsubsubsubsubgroup {
    id: string;
    name: string;
    url: string;
    ordering: string;
}

export interface Group {
    id: string;
    name: string;
    url: string;
    ordering?: string;
    subgroup: Subgroup;
}

export interface Citation {
    year: citationinfo;
    journal: citationinfo;
    volume: citationinfo;
    pageno: citationinfo;
}

export class Iltinfo {
    public country1: iltinfo;
    public country2: iltinfo;
    public article: iltinfo;
    public subject: iltinfo;
    public subsubject: iltinfo;
    public flag1?: iltinfo;
    public flag2?: iltinfo;
}

export class iltinfo {
    public id: string;
    public pid: string;
    public pSubId: string;
    public type: string;
    public name: string;
    public shortName: string;
    public ordering: string;
    public orderInteger?: number | null;
    public url: string;
}


export interface Masterinfo {
    info: Info;
    citations: Citation[];
    iltinfoes: Iltinfo[];
}

export interface CompletionField {
    Input: string[];
    Weight: number;
}

export interface IndexDocument {
    id: string;
    mid?: string;
    excusdocid?: string;
    caseid?: string;
    searchboosttext?: string;
    headnotestext?: string;
    documenttype?: string;
    documenttypeboost?: number;
    documentformat?: string;
    filenamepath?: string;
    comparefilepath?: string;
    categories?: Category[];
    groups?: Groups;
    year?: Year;
    masterinfo?: Masterinfo;
    searchcitation?: SearchCitation;
    searchiltcitation?: SearchIltCitation;
    otherinfo?: any; // Use a suitable interface for Otherinfo if it exists
    taginfo?: Taginfo[];
    markinginfo?: Markinginfo[];
    paragraphinfo?: ParagraphInfo[];
    headnotes?: Headnote[];
    heading?: string;
    tldheading?: string;
    tldsubjects?: string[];
    subheading?: string;
    topstoryheading?: string;
    topstorydesc?: string;
    sortheading?: string;
    sortheadingnumber?: string;
    sortnumber?: number | null;
    sortbycourt?: string;
    sortbyname?: string;
    sortbyauthor?: string;
    sortbycitation?: string;
    sortbycitationcentax?: string;
    sortbycitationcentaxelt?: string;
    sortbycitationcentaxgstl?: string;
    sortbycitationcentaxstr?: string;
    searchheadingnumber?: string;
    documentdate?: string;
    displaydocumentdatestring?: string;
    shortcontent?: string;
    fullcontent?: string;
    comparefilecontent?: string;
    comparefileheading?: string;
    url?: string;
    parentheadings?: Parentheading[];
    language?: string;
    associates?: Associates;
    companyactinfo?: Casections[];
    Content?: string;
    attachment?: Attachment;
    created_date?: Date | null;
    updated_date?: Date | null;
    formatteddocumentdate?: Date | null;
    ispublished?: boolean;
    lastpublished_date?: Date | null;
    lastQCDate?: Date | null;
    isshowonsite?: boolean;
    boostpopularity?: number;
    viewcount?: number;
    videoduration?: string;
    videothumbfile?: string;
    footnotecontent?: string;
    Suggest?: CompletionField[];
    templateid?: string;
    xmltag?: string;
    wordphraseids?: string[];
}

export interface FormattedCitation {
    name?: string;
}

export interface SearchCitation {
    formattedcitation: FormattedCitation[];
}

export interface SearchIltCitation {
    formattediltcitation: FormattedCitation[];
}

export interface Groups {
    group: Group;
}

export interface Year {
    id: string;
    name: string;
}

export interface Taginfo {
    id: string;
    name: string;
    validity?: string;
}

export interface Headnote {
    number: number;
    text: string;
}

export interface Subparentheading {
    id: string;
    name: string;
    ordering: string;
    orderInteger: number;
}

export interface Parentheading {
    id?: string;
    name?: string;
    pid?: string;
    pname?: string;
    ordering?: string;
    orderInteger?: number;
    hasfile?: string;
    subparentheading?: Subparentheading;
}

export interface Parentheadings {
    parentheadings: Parentheading[];
}

export interface Ca2013Section {
    // Add the properties for the ca2013section here
}

export interface Casections {
    id: string;
    name: string;
    actname: string;
    url: string;
    ca2013section: Ca2013Section[];
}

export interface ParagraphInfo {
    pid: string;
    cid: string;
    name: string;
    ordering: number;
}

export interface Associate {
    id?: string;
    type?: string;
    name: string;
    date?: string;
    subheading?: string;
    url?: string;
    associatedDocid?: string;
    actsectionid?: string;
    ordering?: string;
    courtshortname?: string;
}

export interface Associates {
    act?: Associate[];
    rule?: Associate[];
    ruleno?: Associate[];
    section?: Associate[];
    subject?: Associate[];
    casereferred?: Associate[];
    affirmreverse?: Associate[];
    slp?: Associate[];
    cirnot?: Associate[];
    expert?: Associate[];
}

export interface Attachment {
    author: string;
    content: string;
    content_length: number | null;
    content_type: string;
    date: Date | null;
    keywords: string;
    language: string;
    detect_language: boolean | null;
    name: string;
    title: string;
    indexed_chars: number | null;
}

export interface GenericInfo {
    id: string;
    pid: string;
    catUrls: string[];
    actsectionyearid: string;
    type: string;
    name: string;
    shortName: string;
    ordering: string;
    orderInteger: number;
    url: string;
    designation: string;
    socialSiteUrl: string;
    imagePath: string;
    year: string;
    actsectionid: string;
}

export interface Info {
    act: GenericInfo[];
    actno: GenericInfo[];
    rule: GenericInfo[];
    form: GenericInfo[];
    section: GenericInfo[];
    genericInfo: GenericInfo[];
    court: GenericInfo[];
    benchtype: GenericInfo[];
    bench: GenericInfo[];
    infavourof: GenericInfo[];
    instruction: GenericInfo[];
    state: GenericInfo[];
    language: GenericInfo[];
    formtype: GenericInfo[];
    classification: GenericInfo[];
    subclassification: GenericInfo[];
    services: GenericInfo[];
    standards: GenericInfo[];
    substandards: GenericInfo[];
    accountingstandard: GenericInfo[];
    indas: GenericInfo[];
    // caro: GenericInfo[];
    authors: GenericInfo[];
    industry: GenericInfo[];
    company: GenericInfo[];
    area: GenericInfo[];
    clause: GenericInfo[];
    presentations: GenericInfo[];
    opinions: GenericInfo[];
    topics: GenericInfo[];
    cirnotdoctype: GenericInfo[];
    isbn: GenericInfo[];
    prodid: GenericInfo[];
    dateofpublication: GenericInfo[];
    booktype: GenericInfo[];
    subject: GenericInfo[];
    cirnot: GenericInfo[];
    ruleno: GenericInfo[];
    formno: GenericInfo[];
}
export interface casections {
    id: string;
    name: string;
    actname: string;
    url: string;
    ca2013section: ca2013section[];
}

export interface ca2013section {
    id: string;
    name: string;
    actname: string;
    url: string;
}
export class citationinfo {
    id: string;
    type: string;
    shortName: string;
    ordering: string;
    orderInteger: number;
    name: string;
    url: string;
}

export interface otherinfo {
    id: string;
    type: string;
    name: string;
    shortName: string;
}

export interface Otherinfo {
    fullcitation: otherinfo[];
    similarfullcitation: otherinfo[];
    judge: otherinfo[];
    counselname: otherinfo[];
    appealno: otherinfo[];
    asstyr: otherinfo[];
    partyname: otherinfo[];
}

export interface Markinginfo {
    number: number;
    text: string;
    parentmarking?: string;
    image: string;
    entrydate?: string;
    updateddate?: string;
}

