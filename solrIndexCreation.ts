import { Common } from './common';
import { Constants } from './constants';
import { Associate, Associates, Category, CompletionField, GenericInfo, IndexDocument, Info, Masterinfo, Subcategory, casections, ca2013section, Groups, Subgroup, Group, Citation, FormattedCitation, citationinfo, SearchCitation, Otherinfo, otherinfo, SearchIltCitation, Iltinfo, iltinfo, Taginfo, Markinginfo, Headnote, Subsubgroup, Subsubsubgroup, Subsubsubsubgroup, ParagraphInfo } from './indexDocument';
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// class ElasticIndexCreation {
const indexDocumentList: IndexDocument[] = {} as IndexDocument[];
const indexType: any = "";

//     constructor(indexType: number) {
//       this.indexDocumentList = [];
//       this.indexType = indexType;
//     }

// DeleteRecordsFromIndex(ids: string[]): string {
//   const status: string = BulkDelete(ids, IndexLocalPath, IndexName, IndexDocument);
//   return status;
// }

// UpdateRecordsInIndex(viewcounts: ViewCount[]): string {
//   const status: string = BulkUpdate(viewcounts, IndexLocalPath, IndexName, IndexDocument);
//   return status;
// }


async function ActRuleIndex(dt: any, docType: number, templateid: string): Promise<void> {
    const indexDocumentList: IndexDocument[] = [];
    if (dt != null && dt.Rows.Count > 0) {
        console.log("Total Number Of Records = " + dt.Rows.Count + "\n");
        Common.writeLog("Total Number Of Records = " + dt.Rows.Count + "\n");
    }

    const batchSize = 1000; // magic
    const totalBatches = Math.ceil(dt.Rows.Count / batchSize);
    console.log("Total Document Batch Started: " + totalBatches + "\n");
    for (let i = 0; i < totalBatches; i++) {
        console.log("Number of Documents in list: " + indexDocumentList.length + "\n");
        console.log("Document Batch No started: " + (i + 1) + "\n");

        const dataRows = dt.AsEnumerable().Skip(i * batchSize).Take(batchSize);
        if (dataRows.Count() > 0) {
            console.log("Data Row Count: " + dataRows.Count() + "\n");
            for (const dr of dataRows) {
                const objSuggest: CompletionField[] = [];
                Common.writeLog("log start for actid:" + dr["mid"]);

                try {
                    const indexDocument: IndexDocument = {} as IndexDocument;
                    indexDocument.id = String(dr["mid"]).trim();
                    indexDocument.mid = String(dr["id"]).trim();
                    indexDocument.templateid = templateid;
                    indexDocument.documenttype = String(dr["documenttype"]).toLowerCase().trim();
                    indexDocument.documentformat = String(dr["documentformat"]).toLowerCase().trim();
                    indexDocument.filenamepath = String(dr["filenamepath"]).trim();

                    if (String(dr["url"]).toLowerCase().indexOf(".pdf") !== -1) {
                        indexDocument.filenamepath = new Common.UploadPdfFilesOnAmazonS3Bucket(indexDocument.id, indexDocument.filenamepath);
                    }

                    try {
                        // Common.UploadImageOnAmazonS3Bucket(indexDocument.id, System.Configuration.ConfigurationManager.AppSettings["imagePath"]);
                        Common.UploadImageOnAmazonS3BucketCentax(indexDocument.id, indexDocument.mid);
                    } catch (ex) {
                        Common.LogError(ex, "MID = " + dr["mid"] + "S3 upload error");
                    }

                    if (docType === 1) {
                        // Common.UploadLinkFilesOnS3(indexDocument.id, "act");
                        Common.UploadLinkFilesOnS3Centax(indexDocument.mid, "act", indexDocument.documentformat, String(dr["url"]).trim(), indexDocument.id);
                        indexDocument.comparefilepath = String(dr["cmpFileName"]).trim();
                        indexDocument.comparefilepath = Common.htmlFileManagement(indexDocument.id, indexDocument.comparefilepath.replace("|", "").trim(), "");
                    }

                    const year = String(dr["year"]).trim();
                    if (!!year) {
                        if (year.length > 4) {
                            indexDocument.year = { id: year.substring(0, 18).trim(), name: year.substring(18, 4).trim() };
                        } else {
                            indexDocument.year = { id: year.trim(), name: year.trim() };
                        }
                    } else {
                        indexDocument.year = { id: "", name: "" };
                    }

                    //#region act associations
                    const objAssociates: Associates = { act: [], section: [] };

                    const associationArray = !!dr["DDA_Acts"] ? dr["DDA_Acts"].split('$') : null;
                    if (associationArray != null && associationArray.length > 1) {
                        const objActAssociations: Associate[] = [];
                        const objSectionAssociations: Associate[] = [];

                        for (const association of associationArray) {
                            const associations = association.split('|');

                            if (associations != null && association.length > 1) {
                                const objActAssociate: Associate = { id: "", type: "", name: "", associatedDocid: "", url: "" };
                                const objSectionAssociate: Associate = { id: "", type: "", name: "", associatedDocid: "", url: "" };

                                const actidsecid = associations[0].indexOf('#') !== -1 ? associations[0].trim().split('#') : null;
                                const type = associations[0] !== "" ? associations[1].split('^')[0].toLowerCase() : "";

                                if (type.toLowerCase().trim() === "act") {
                                    if (!!associations[0]) {
                                        objActAssociate.id = associations[0].trim();
                                        objActAssociate.type = type;
                                        objActAssociate.name = associations[1] !== "" ? associations[1].split('^')[1] : "";
                                        objActAssociate.associatedDocid = "";
                                        if (!!objSectionAssociate && !!objActAssociate.name) objActAssociate.url = Common.GetUrl(objActAssociate.name.toLowerCase());

                                        objActAssociations.push(objActAssociate);
                                    }
                                } else {
                                    let objSBytes: number;
                                    let section = associations[1] !== "" ? associations[1].split('^')[1] : "";

                                    if (!!section && !isNaN(section.charCodeAt(0))) {
                                        section = "Section - " + section;
                                    }

                                    if (!!actidsecid[1]) {
                                        objSectionAssociate.id = actidsecid[1];
                                        objSectionAssociate.type = type;
                                        objSectionAssociate.name = section.indexOf("~") !== -1 ? section.split('~')[0] : section;
                                        objSectionAssociate.ordering = section.indexOf("~") !== -1 ? section.split('~')[1] : "";
                                        objSectionAssociate.associatedDocid = actidsecid[0];
                                        objSectionAssociate.actsectionid = actidsecid[0] + actidsecid[1];
                                        if (!!objSectionAssociate && !!objSectionAssociate.name) objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name.toLowerCase());
                                        objSectionAssociations.push(objSectionAssociate);
                                    }
                                }
                            }
                        }

                        objAssociates.act = objActAssociations;
                        objAssociates.section = objSectionAssociations;
                    }

                    //#endregion

                    //#region rule associations 

                    const ruleAssociationArray = !!dr["DDA_Rules"] ? dr["DDA_Rules"].split('$') : null;
                    if (ruleAssociationArray != null && ruleAssociationArray.length > 1) {
                        const objRuleAssociations: Associate[] = [];
                        const objRuleNoAssociations: Associate[] = [];

                        for (const association of ruleAssociationArray) {
                            const associations = association.split('|');

                            if (associations != null && associations.length > 1) {
                                const objRuleAssociate: Associate = { id: "", type: "", name: "", associatedDocid: "", url: "" };
                                const objRulenoAssociate: Associate = { id: "", type: "", name: "", associatedDocid: "", url: "" };

                                const ruleidrulenoid = associations[0].indexOf('#') !== -1 ? associations[0].trim().split('#') : null;
                                const type = associations[0] !== "" ? associations[1].split('^')[0].toLowerCase() : "";

                                if (type.trim() === "rule") {
                                    if (!!associations[0]) {
                                        objRuleAssociate.id = associations[0].trim();
                                        objRuleAssociate.type = type;
                                        objRuleAssociate.name = associations[1] !== "" ? associations[1].split('^')[1] : "";
                                        objRuleAssociate.associatedDocid = "";
                                        objRuleAssociate.url = Common.GetUrl(objRuleAssociate.name.toLowerCase());
                                        objRuleAssociations.push(objRuleAssociate);
                                    }
                                } else {
                                    let objSBytes: number;
                                    let ruleno = associations[1] !== "" ? associations[1].split('^')[1] : "";

                                    if (!!ruleno && !isNaN(ruleno.charCodeAt(0))) {
                                        ruleno = "Rule - " + ruleno;
                                    }

                                    if (!!ruleidrulenoid[1]) {
                                        objRulenoAssociate.id = ruleidrulenoid[1];
                                        objRulenoAssociate.type = type;
                                        objRulenoAssociate.name = ruleno;
                                        objRulenoAssociate.associatedDocid = ruleidrulenoid[0];
                                        objRulenoAssociate.url = Common.GetUrl(objRulenoAssociate.name.toLowerCase());
                                        objRuleNoAssociations.push(objRulenoAssociate);
                                    }
                                }
                            }
                        }

                        objAssociates.rule = objRuleAssociations;
                        objAssociates.ruleno = objRuleNoAssociations;
                    }

                    //#endregion

                    // #region CAT SUBCAT BINDING

                    const catSubCatArray = !!dr["categoriescentax"] ? dr["categoriescentax"].split('$') : null;
                    if (catSubCatArray != null) {
                        const objCatList: any[] = [];
                        for (const catsubcat of catSubCatArray) {
                            if (!!catsubcat) {
                                const objCat: any = {};
                                const objSubCat: any = {};
                                const isprimarycat = catsubcat.split('%').length > 1 ? parseInt(catsubcat.split('%')[1]) : 0;

                                if (catsubcat.indexOf('|') > 0) {
                                    const catidname = !!catsubcat ? catsubcat.split('|') : null;
                                    const mainCat = catidname[1].trim().split('^')[0].trim();
                                    const isRequiredCategory =
                                        mainCat.includes("111050000000018392") ||
                                        mainCat.includes("111050000000018393") ||
                                        mainCat.includes("111050000000018400") ||
                                        mainCat.includes("111050000000018768") ||
                                        mainCat.includes("111050000000018769") ||
                                        mainCat.includes("111050000000018770") ||
                                        mainCat.includes("111050000000018771") ||
                                        mainCat.includes("111050000000018772") ||
                                        mainCat.includes("111050000000019031");

                                    if (!isRequiredCategory) continue;

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objCat.id = catidname[1].trim().split('^')[0].trim();
                                            objCat.name = catidname[1].split('^')[1].trim().split('%')[0];
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.competitionCategoryId:
                                            objCat.id = Constants.competitionCategoryId;
                                            objCat.name = Constants.competitionCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.tpCategoryId:
                                            objCat.id = Constants.tpCategoryId;
                                            objCat.name = Constants.tpCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.iltCategoryId:
                                            objCat.id = Constants.iltCategoryId;
                                            objCat.name = Constants.iltCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        default:
                                            objCat.id = catidname[0].trim().split('^')[0].trim();
                                            objCat.name = catidname[0].split('^')[1].trim().split('%')[0];
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                    }

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objSubCat.id = catidname[2].trim().split('^')[0].trim();
                                            objSubCat.name = catidname[2].split('^')[1].trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.competitionCategoryId:
                                            objSubCat.id = Constants.competitionCategoryId;
                                            objSubCat.name = Constants.competitionCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.tpCategoryId:
                                            objSubCat.id = Constants.tpCategoryId;
                                            objSubCat.name = Constants.tpCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.iltCategoryId:
                                            objSubCat.id = Constants.iltCategoryId;
                                            objSubCat.name = Constants.iltCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        default:
                                            objSubCat.id = catidname[1].trim().split('^')[0].trim();
                                            objSubCat.name = catidname[1].split('^')[1].trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                    }
                                    objCat.subcategory = objSubCat;
                                } else {
                                    objCat.id = catsubcat.split('^')[0].trim();
                                    objCat.name = catsubcat.split('^')[1].trim().split('%')[0];
                                    objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                    objCat.isprimarycat = isprimarycat;

                                    objSubCat.id = "";
                                    objSubCat.name = "";
                                    objSubCat.url = "";
                                    objCat.subcategory = objSubCat;
                                }
                                objCatList.push(objCat);
                            }
                        }
                        indexDocument.categories = objCatList;
                    }

                    //#endregion

                    const groupSubgroupArray = !!dr["groups"] ? dr["groups"].split('|') : null;
                    let isaop = false;
                    if (groupSubgroupArray != null) {
                        if (groupSubgroupArray[0].split('^')[0].trim() == Constants.aopGroupId)
                            isaop = true;
                        const objGroups: any = {};
                        const objSubGroup: any = {};
                        objSubGroup.id = groupSubgroupArray[1].split('^')[0].trim();

                        if ((objSubGroup.id == "111050000000010567" || objSubGroup.id == "111050000000017750" || objSubGroup.id == "111050000000017787") && indexDocument.year.name == "2019")
                            objSubGroup.name = groupSubgroupArray[1].split('^')[1].trim() + ", 2019";
                        else if (objSubGroup.id == "111050000000010567" && indexDocument.year.name == "2020")
                            objSubGroup.name = groupSubgroupArray[1].split('^')[1].trim() + ", 2020";
                        else
                            objSubGroup.name = groupSubgroupArray[1].split('^')[1].trim();
                        objSubGroup.url = Common.GetUrl(objSubGroup.name.toLowerCase());
                        objGroups.group = { id: groupSubgroupArray[0].split('^')[0].trim(), name: docType == 3 ? "form" : groupSubgroupArray[0].split('^')[1].trim(), url: docType == 3 ? "form" : Common.GetUrl(groupSubgroupArray[0].split('^')[1].toLowerCase().trim()), subgroup: objSubGroup };
                        indexDocument.groups = objGroups;
                        if (!!objSubGroup.name.trim()) {
                            objSuggest.push({
                                Input: [objSubGroup.name.toLowerCase().trim()],
                                Weight: 20
                            });
                        }
                    }

                    let objSByte: number;
                    if (!dr["Heading"].toString().toLowerCase().includes("schedule") && !dr["Heading"].toString().toLowerCase().includes("appendix")) {
                        if (docType == 1) {
                            let section = dr["Heading"].toString();
                            if (!!section && parseInt(section.substring(0, 1))) {
                                section = dr["groups"].toString().indexOf("111050000000012773") != -1 ? "Article - " + section : "Section - " + section;
                            }
                            indexDocument.heading = section.trim();
                        } else if (docType == 2) {
                            let rule = dr["Heading"].toString().trim();
                            if (dr["groups"].toString().toLowerCase().indexOf("regulations") != -1)
                                rule = "Regulation - " + rule;
                            else if (!!rule && parseInt(rule.substring(0, 1))) {
                                rule = "Rule - " + rule;
                            }
                            indexDocument.heading = rule.trim();
                            if (!!indexDocument.heading && indexDocument.heading[indexDocument.heading.length - 1] == '.') {
                                indexDocument.heading = indexDocument.heading.substring(0, indexDocument.heading.length - 1);
                            }
                        } else
                            indexDocument.heading = dr["Heading"].toString().trim();
                    } else
                        indexDocument.heading = dr["Heading"].toString().trim();

                    indexDocument.subheading = dr["subheading"].toString().trim();
                    indexDocument.sortheading = dr["sortheading"].toString().toLowerCase().trim();
                    indexDocument.sortheadingnumber = dr["sortheadingnumber"].toString().toLowerCase().trim();
                    indexDocument.searchheadingnumber = dr["searchheadingnumber"].toString().toLowerCase().trim();
                    if (docType == 1) {
                        const parentheading = !dr["parentheading"].toString().replace("|^", "") ? dr["parentheading"].toString().split('|') : null;
                        if (parentheading != null) {
                            const parentName = parentheading[1].replace('^', ' ').trim();
                            if (parentName.indexOf('#') != -1) {
                                const nameOrder = parentName.split('#');
                                indexDocument.parentheadings = [{ id: parentheading[0], name: nameOrder[0], ordering: nameOrder[1], orderInteger: Number(nameOrder[1]) }];
                            } else
                                indexDocument.parentheadings = [{ id: parentheading[0], name: parentName, ordering: "", orderInteger: 0 }];
                        }
                    }

                    if (docType == 2) {
                        const parentChildArray = !!dr["parentheading"] ? dr["parentheading"].toString().split('$') : null;
                        if (parentChildArray != null) {
                            const objParentList: any = {};
                            const objParents: any[] = [];
                            for (const parentSubParent of parentChildArray) {
                                if (parentSubParent.indexOf('|') > 0) {
                                    const parentchild = !!parentSubParent ? parentSubParent.split('|') : null;
                                    const objParent: any = {};
                                    objParent.id = parentchild[0].trim().split('^')[0].trim();
                                    const parentName = parentchild[0].split('^')[1].trim();
                                    if (parentName.indexOf('#') != -1) {
                                        const nameOrder = parentName.split('#');
                                        objParent.name = nameOrder[0];
                                        objParent.ordering = nameOrder[1];
                                        objParent.orderInteger = Number(objParent.ordering);
                                    } else {
                                        objParent.name = parentName;
                                        objParent.ordering = "";
                                    }
                                    const objSubParent: any = {};
                                    objSubParent.id = parentchild[1].trim().split('^')[0].trim();
                                    objSubParent.name = parentchild[1].trim().split('^')[1].trim() + " - RuleNo :" + dr["Heading"].toString().trim();
                                    objSubParent.ordering = objParent.ordering;
                                    objSubParent.orderInteger = objParent.orderInteger;
                                    objParent.subparentheading = objSubParent;
                                    objParents.push(objParent);
                                }
                            }
                            objParentList.parentheadings = objParents;
                            indexDocument.parentheadings = objParentList.parentheadings;
                        } else
                            indexDocument.parentheadings = [{ id: "", name: "", ordering: "", orderInteger: 0 }];
                    }

                    indexDocument.url = dr["url"].toString().toLowerCase().trim();
                    indexDocument.language = dr["language"].toString().toLowerCase().trim();


                    //#region subject master
                    const caseSubjectArray = !!dr["ActRuleSubject"] ? dr["ActRuleSubject"].toString().split('$') : null;
                    const objsubjects: any[] = [];

                    if (caseSubjectArray != null && caseSubjectArray.length > 1) {
                        for (const association of caseSubjectArray) {
                            const associations = association.split('|');

                            if (associations != null && association.length > 1) {
                                const objSubject: any = {};

                                const type = associations[0] !== "" ? associations[1].split('^')[0].toLowerCase() : "";
                                if (type.trim() === "subject") {
                                    if (!!associations[0]) {
                                        //string[] categories = Common.CasePopularActs()[associations[0].trim()][1].split(',');
                                        objSubject.id = associations[0].trim();
                                        objSubject.type = type;
                                        objSubject.name = associations[1] !== "" ? associations[1].split('^')[1].split('~')[0] : "";
                                        objSubject.shortName = "";
                                        objSubject.ordering = associations[1].split('^')[1].split('~')[1];
                                        objSubject.orderInteger = 0;
                                        objSubject.url = Common.GetUrl(objSubject.name.toLowerCase());
                                        //objSubject.catUrls = categories;
                                        objsubjects.push(objSubject);
                                        if (!!objSubject.name.trim()) {
                                            objSuggest.push({
                                                Input: [objSubject.name.toLowerCase().trim()],
                                                Weight: 18
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }

                    //#endregion


                    const multipleMasterInfo = !!dr["masterinfo"] ? dr["masterinfo"].toString().split('$') : null;
                    const objMasters: any = {};
                    const objMasterInfo: any = {};

                    const objActs: any[] = [];
                    const objActNos: any[] = [];
                    const objSections: any[] = [];
                    const objRules: any[] = [];
                    const objStates: any[] = [];

                    if (multipleMasterInfo != null && multipleMasterInfo.length > 1 && multipleMasterInfo[1] !== "") {
                        const objlanguages: any[] = [];
                        const objinstructions: any[] = [];
                        for (const masterInfo of multipleMasterInfo) {
                            const objact: any = {};
                            const objactno: any = {};
                            const objsection: any = {};
                            const objrule: any = {};
                            const objstate: any = {};

                            const masterinfo = !!masterInfo ? masterInfo.split('|') : null;
                            if (!masterInfo) {
                                const objlanguage: any = {};
                                const objinstruction: any = {};
                                const type = masterinfo[1].split('^')[0].toLowerCase().trim(); // Type

                                const parentName = masterinfo[1].split('^')[1];
                                if (type === "act") {
                                    if (parentName.indexOf('#') !== -1) {
                                        const nameOrder = parentName.split('#');
                                        objact.id = masterinfo[0].trim();
                                        objact.name = nameOrder[0];
                                        objact.ordering = nameOrder[1].replace('$', ' ').trim();
                                        objact.orderInteger = parseInt(objact.ordering);
                                        objact.type = type;

                                        if (isaop && objact.name.lastIndexOf('[') !== -1) {
                                            objactno.id = objact.id;
                                            objactno.name = objact.name.substring(objact.name.lastIndexOf('[')).replace('[', ' ').replace(']', ' ').trim();
                                            objactno.ordering = objactno.name.trim().toLowerCase().replace("of", "").replace(" ", "");
                                            objactno.orderInteger = parseInt(objactno.ordering);
                                            objactno.type = "actno";
                                            objactno.url = Common.GetUrl(objactno.name.toLowerCase());
                                        }
                                    } else {
                                        objact.id = masterinfo[0].trim();
                                        objact.name = parentName;
                                        objact.ordering = "";
                                        objact.orderInteger = 0;
                                        objact.type = type;
                                    }
                                    objact.url = Common.GetUrl(objact.name.toLowerCase());
                                    objActs.push(objact);
                                    objActNos.push(objactno);
                                } else if (type === "section") {
                                    if (masterinfo[0].indexOf('#') !== -1) {
                                        const yearname = indexDocument.year.name.trim() || "0000";
                                        objsection.id = masterinfo[0].toString().split('#')[1].trim();
                                        objsection.actsectionyearid = masterinfo[0].toString().split('#')[0].trim() + masterinfo[0].toString().split('#')[1].trim() + yearname;
                                        objsection.name = masterinfo[1].toString().replace('^', '-').split('~')[0];
                                        objsection.ordering = masterinfo[1].toString().replace('^', '-').split('~')[1];
                                        objsection.orderInteger = 0;
                                        objsection.type = type;

                                        if (type.toLowerCase() === "section") {
                                            const splitSectionName = objsection.name.split('-');
                                            if (splitSectionName && splitSectionName[0].toLowerCase().includes("section")) {
                                                try {
                                                    objsection.name = "Section - " + splitSectionName.slice(1).join("");
                                                } catch (ex) {
                                                    Common.LogError(ex, "MID  = " + dr["mid"] + "section name split error");
                                                    Common.writeLog("error for actid in masterinfo section:" + ex.message);
                                                }
                                            }
                                        }

                                        if (objsection.name.toLowerCase().includes("schedule") || objsection.name.toLowerCase().includes("appendix")) {
                                            objsection.name = objsection.name.replace(/Section - /gi, "").replace(/Section-/gi, "").replace(/Section/gi, "");
                                        }
                                    }
                                    objsection.url = Common.GetUrl(objsection.name.toLowerCase());
                                    objSections.push(objsection);
                                } else if (type === "rule") {
                                    if (parentName.indexOf('#') !== -1) {
                                        const nameOrder = parentName.split('#');
                                        objrule.id = masterinfo[0].trim();
                                        objrule.name = nameOrder[0];
                                        if (objrule.name[objrule.name.length - 1] === '.') {
                                            objrule.name = objrule.name.substring(0, objrule.name.length - 1);
                                        }
                                        objrule.ordering = nameOrder[1].replace('$', ' ').trim();
                                        objrule.orderInteger = parseInt(objrule.ordering);
                                        objrule.type = type;
                                    } else {
                                        objrule.id = masterinfo[0].trim();
                                        objrule.name = parentName;
                                        objrule.ordering = "";
                                        objrule.orderInteger = 0;
                                        objrule.type = type;
                                    }
                                    objrule.url = Common.GetUrl(objrule.name.toLowerCase());
                                    objRules.push(objrule);
                                } else if (type === "state") {
                                    if (parentName.indexOf('#') !== -1) {
                                        const nameOrder = parentName.split('#');
                                        objstate.id = masterinfo[0].trim();
                                        objstate.name = nameOrder[0];
                                        objstate.ordering = nameOrder[1];
                                        objstate.orderInteger = parseInt(objstate.ordering);
                                        objstate.type = type;
                                    } else {
                                        objstate.id = masterinfo[0].trim();
                                        objstate.name = parentName;
                                        objstate.ordering = "";
                                        objstate.orderInteger = 0;
                                        objstate.type = type;
                                    }
                                    objstate.url = Common.GetUrl(objstate.name.toLowerCase());
                                    objStates.push(objstate);
                                }
                            }
                        }

                        // objMasters.info.genericInfo = objInfos;
                    } else {
                        const objact: any = {};
                        const objrule: any = {};
                        const objstate: any = {};
                        const masterinfo = !!dr["masterinfo"] ? dr["masterinfo"].split('|') : null;

                        const objInfos: any[] = [];
                        const objinfo: any = {};
                        objinfo.id = masterinfo[0].trim();
                        const type = masterinfo[1].split('^')[0].toLowerCase().trim(); // Type

                        if (docType === 4) {
                            const langInst = !!masterinfo[1].split('^')[1] ? masterinfo[1].split('^')[1].split(',') : null;
                            if (langInst) {
                                objinfo.name = langInst[0].trim();
                            }
                        } else {
                            const parentName = masterinfo[1].split('^')[1];
                            if (type === "act") {
                                if (parentName.indexOf('#') !== -1) {
                                    const nameOrder = parentName.split('#');
                                    objact.id = masterinfo[0].trim();
                                    objact.name = nameOrder[0];
                                    objact.ordering = nameOrder[1].replace('$', ' ').trim();
                                    objact.orderInteger = parseInt(objact.ordering);
                                    objact.type = type;
                                } else {
                                    objact.id = masterinfo[0].trim();
                                    objact.name = parentName;
                                    objact.ordering = "";
                                    objact.orderInteger = 0;
                                    objact.type = type;
                                }
                                objact.url = Common.GetUrl(objact.name.toLowerCase());
                                objActs.push(objact);
                            } else if (type === "rule") {
                                if (parentName.indexOf('#') !== -1) {
                                    const nameOrder = parentName.split('#');
                                    objrule.id = masterinfo[0].trim();
                                    objrule.name = nameOrder[0];
                                    objrule.ordering = nameOrder[1].replace('$', ' ').trim();
                                    objrule.orderInteger = parseInt(objrule.ordering);
                                    objrule.type = type;
                                } else {
                                    objrule.id = masterinfo[0].trim();
                                    objrule.name = parentName;
                                    objrule.ordering = "";
                                    objrule.orderInteger = 0;
                                    objrule.type = type;
                                }
                                objrule.url = Common.GetUrl(objrule.name.toLowerCase());
                                objRules.push(objrule);
                            } else if (type === "state") {
                                if (parentName.indexOf('#') !== -1) {
                                    const nameOrder = parentName.split('#');
                                    objstate.id = masterinfo[0].trim();
                                    objstate.name = nameOrder[0];
                                    objstate.ordering = nameOrder[1];
                                    objstate.orderInteger = parseInt(objstate.ordering);
                                    objstate.type = type;
                                } else {
                                    objstate.id = masterinfo[0].trim();
                                    objstate.name = parentName;
                                    objstate.ordering = "";
                                    objstate.orderInteger = 0;
                                    objstate.type = type;
                                    objstate.ordering = "";
                                }
                                objstate.url = Common.GetUrl(objstate.name.toLowerCase());
                                objStates.push(objstate);
                            }
                        }

                        // objMasters.info.genericInfo = objInfos;
                    }

                    if (docType === 1) {
                        // #region aaa association
                        const asindases = !!dr["AAAAssociation"] ? dr["AAAAssociation"].toString().split('$') : null;
                        if (asindases) {
                            const objasinfoes: any[] = [];
                            const objindasinfoes: any[] = [];
                            for (const asindas of asindases) {
                                if (!!asindas) {
                                    const asindasinfo = asindas.split('^');
                                    const type = asindasinfo[0].split('|')[1].trim();
                                    if (type !== "" && type.toLowerCase() === "account standard") {
                                        if (!!asindasinfo[0].split('|')[0]) {
                                            const objasinfo: any = {};
                                            objasinfo.id = asindasinfo[0].split('|')[0].trim();
                                            objasinfo.type = "accountingstandard"; // Type
                                            objasinfo.name = asindasinfo[1].indexOf('#') !== -1 ? asindasinfo[1].split('#')[0].trim() : "";
                                            objasinfo.shortName = objasinfo.name.indexOf(':') !== -1 ? objasinfo.name.split(':')[0].trim() : "";
                                            objasinfo.ordering = objasinfo.shortName.toLowerCase();
                                            objasinfo.orderInteger = parseInt(asindasinfo[1].split('#')[1].split('~')[0].trim());
                                            objasinfo.year = asindasinfo[1].split('#')[1].split('~')[1].trim();
                                            objasinfo.url = Common.GetUrl(objasinfo.shortName.toLowerCase());
                                            objasinfoes.push(objasinfo);
                                        }
                                    } else if (type !== "" && type.toLowerCase() === "ind as") {
                                        if (!!asindasinfo[0].split('|')[0]) {
                                            const objindasinfo: any = {};
                                            objindasinfo.id = asindasinfo[0].split('|')[0].trim();
                                            objindasinfo.type = "indas"; // Type
                                            objindasinfo.name = asindasinfo[1].indexOf('#') !== -1 ? asindasinfo[1].split('#')[0].trim() : "";
                                            objindasinfo.shortName = objindasinfo.name.indexOf(':') !== -1 ? objindasinfo.name.split(':')[0].trim() : "";
                                            objindasinfo.ordering = objindasinfo.shortName.toLowerCase();
                                            objindasinfo.orderInteger = parseInt(asindasinfo[1].split('#')[1].split('~')[0].trim());
                                            objindasinfo.year = asindasinfo[1].split('#')[1].split('~')[1].trim();
                                            objindasinfo.url = Common.GetUrl(objindasinfo.shortName.toLowerCase());
                                            objindasinfoes.push(objindasinfo);
                                        }
                                    }
                                }
                            }
                            objMasterInfo.accountingstandard = objasinfoes;
                            objMasterInfo.indas = objindasinfoes;
                        }
                        // #endregion
                    }


                    // #region rule master info
                    if (indexDocument.documenttype.toLowerCase().trim() === "rule" && !!indexDocument.heading) {
                        const masterInfoRuleno: any[] = [];
                        const mRuleno: any = {};
                        mRuleno.name = indexDocument.heading;
                        mRuleno.url = indexDocument.heading.replace(" ", "").toLowerCase();
                        mRuleno.orderInteger = 0;
                        mRuleno.type = "ruleno";
                        masterInfoRuleno.push(mRuleno);
                        objMasterInfo.ruleno = masterInfoRuleno;
                    }
                    // #endregion rule master info end

                    objMasterInfo.act = objActs;
                    objMasterInfo.actno = objActNos;
                    objMasterInfo.section = objSections;
                    objMasterInfo.rule = objRules;
                    objMasterInfo.state = objStates;
                    objMasterInfo.subject = objsubjects;
                    objMasters.info = objMasterInfo;

                    indexDocument.masterinfo = objMasters;

                    if (docType === 1 || docType === 2) {
                        // #region Tagging Info
                        const taggingInfo = !!dr["TaggingInfo"] ? dr["TaggingInfo"].toString().split('$') : null;
                        const objTags: any[] = [];
                        if (taggingInfo && taggingInfo.length > 0) {
                            for (const taginfo of taggingInfo) {
                                const taginfos = !!taginfo ? taginfo.toString().split('|') : null;
                                if (!!taginfo) {
                                    const objtaginfo: any = {};
                                    objtaginfo.id = taginfos[1].split('^')[0];
                                    objtaginfo.name = taginfos[1].split('^')[1];
                                    objTags.push(objtaginfo);
                                }
                            }
                        } else {
                            const taginfos = !!dr["TaggingInfo"] ? dr["TaggingInfo"].toString().split('|') : null;
                            if (taginfos) {
                                const objtaginfo: any = {};
                                objtaginfo.id = taginfos[1].split('^')[0];
                                objtaginfo.name = taginfos[1].split('^')[1];
                                objTags.push(objtaginfo);
                            }
                        }

                        if (docType === 1) {
                            // add markinginfo as taginfo for acts allied laws
                            const taggingInfo2 = !!dr["AlliedInfo"] ? dr["AlliedInfo"].toString().split('$') : null;

                            if (taggingInfo2 && taggingInfo2.length > 0) {
                                for (const taginfo of taggingInfo2) {
                                    const taginfos = !!taginfo ? taginfo.toString().split('|') : null;
                                    if (!!taginfo.trim()) {
                                        const objtaginfo: any = {};
                                        objtaginfo.id = taginfos[0];
                                        objtaginfo.name = taginfos[1]; //.split('^')[1];
                                        objTags.push(objtaginfo);
                                    }
                                }
                            } else {
                                const taginfos = !!dr["AlliedInfo"] ? dr["AlliedInfo"].toString().split('|') : null;
                                if (taginfos) {
                                    const objtaginfo: any = {};
                                    objtaginfo.id = taginfos[0];
                                    objtaginfo.name = taginfos[1]; //.split('^')[1];
                                    objTags.push(objtaginfo);
                                }
                            }
                        }

                        indexDocument.taginfo = objTags;
                        // #endregion Tagging info end
                    }
                    else {
                        indexDocument.taginfo = [{ id: "", name: "" }];
                    }

                    if (!!indexDocument.groups && !!indexDocument.parentheadings && !!indexDocument.parentheadings[0]?.name) indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(`${(dr["categoriescentax"] ?? "").toString().toLowerCase()} ${indexDocument?.groups.group.name} ${indexDocument.groups.group.subgroup.name} ${indexDocument.year.name} ${Common.StringOnly((dr["masterinfo"] ?? "").toString().toLowerCase())} ${(dr["Heading"] ?? "").toString().trim()} ${(dr["subheading"] ?? "").toString().trim()} ${indexDocument.parentheadings[0]?.name.trim() ?? ""}`);

                    indexDocument.shortcontent = (dr["shortcontent"] ?? "").toString().trim();

                    let fullContent: string = '';
                    let footnotecontent: string[] = [];
                    const regex = /id="foot-ftn(.*?)"/;
                    const doc = new DOMParser().parseFromString((dr["fullcontent"] ?? "").toString(), "text/html");
                    const isHtmlFootnote = doc.querySelectorAll('div.footprint').length > 0;

                    if (isHtmlFootnote && indexDocument.documentformat === ".htm") {
                        doc.querySelectorAll('div.footprint').forEach(item => {
                            item.remove();
                            footnotecontent.push(item.outerHTML);
                        });
                        fullContent = doc.documentElement.innerHTML;
                    } else if ((dr["fullcontent"] ?? "").toString().indexOf("<footnote>") !== -1) {
                        const regexfootnote = /<footnote>(.*?)<\/footnote>/g;
                        const matchesfootnote = (dr["fullcontent"] ?? "").toString().match(regexfootnote);
                        if (matchesfootnote) {
                            footnotecontent = matchesfootnote;
                        }
                        fullContent = (dr["fullcontent"] ?? "").toString().replace(regexfootnote, "");
                    } else {
                        fullContent = (dr["fullcontent"] ?? "").toString();
                    }
                    indexDocument.footnotecontent = footnotecontent.join("");

                    if ((dr["fullcontent"] ?? "").toString().indexOf("<header>") !== -1) {
                        fullContent = Common.RemovedHeaderTag(fullContent);
                    }

                    indexDocument.xmltag = ((dr["fullcontent"] ?? "").toString().indexOf("<header>") !== -1) ? Common.GetMetaTag((dr["fullcontent"] ?? "").toString()) : "";

                    indexDocument.fullcontent = (fullContent.trim().lastIndexOf("</document>") !== -1)
                        ? fullContent.trim().replace("</document>", `<div id='xmlmetadata' style='display:none;'>${indexDocument.searchboosttext}</div></document>`)
                        : (fullContent.lastIndexOf("</html>") !== -1)
                            ? fullContent.trim().replace("</html>", `<div id='htmmetadata' style='display:none;'>${indexDocument.searchboosttext}</div></html>`)
                            : fullContent.trim() + `<div id='nodata' style='display:none;'>${indexDocument.searchboosttext}</div>`;

                    if (!!indexDocument.heading && !!indexDocument.heading.trim()) {
                        objSuggest.push({
                            Input: [indexDocument.heading.toLowerCase().trim()],
                            Weight: 1
                        });
                    }

                    indexDocument.Suggest = objSuggest;

                    if (!!(dr["TaggingInfo"].toString()) && (dr["TaggingInfo"].toString() === "222210000000000002|TC1^Repealed Act" || dr["TaggingInfo"].toString() === "222210000000000041|TC_Service_Tax_Repealed^Service Tax Repealed")) {
                        indexDocument.documenttypeboost = 0;
                    } else {
                        indexDocument.documenttypeboost = docType === 1 ? 10000 : docType === 2 ? 8000 : 0;
                    }

                    indexDocument.documentdate = dr["documentdate"].toString();
                    indexDocument.formatteddocumentdate = new Date(!!indexDocument.documentdate ? indexDocument.documentdate.substring(0, 4) + "-" + indexDocument.documentdate.substring(4, 2) + "-" + indexDocument.documentdate.substring(6, 2) : "1900-01-01");

                    indexDocument.created_date = new Date(!!dr["created_date"].toString() && dr["created_date"].toString().length > 10
                        ? dr["created_date"].toString().substring(0, 4) + "-" + dr["created_date"].toString().substring(4, 2) + "-" + dr["created_date"].toString().substring(6, 2) + " " + dr["created_date"].toString().substring(8, 2) + ":" + dr["created_date"].toString().substring(10, 2) + ":" + dr["created_date"].toString().substring(12, 2)
                        : "1900-01-01");

                    if (!!indexDocument.documentdate) { const formatteddate = indexDocument.documentdate !== "" ? indexDocument.documentdate.substring(0, 4) + "-" + indexDocument.documentdate.substring(4, 2) + "-" + indexDocument.documentdate.substring(6, 2) : "1900-01-01"; }

                    if (!!dr["UpdatedDate"].toString() && dr["UpdatedDate"].toString().length > 13) {
                        indexDocument.updated_date = new Date(!!dr["UpdatedDate"].toString()
                            ? dr["UpdatedDate"].toString().substring(0, 4) + "-" + dr["UpdatedDate"].toString().substring(4, 2) + "-" + dr["UpdatedDate"].toString().substring(6, 2) + " " + dr["UpdatedDate"].toString().substring(8, 2) + ":" + dr["UpdatedDate"].toString().substring(10, 2) + ":" + dr["UpdatedDate"].toString().substring(12, 2)
                            : "1900-01-01");
                    } else if (!!dr["UpdatedDate"].toString() && dr["UpdatedDate"].toString().trim().length === 8) {
                        indexDocument.updated_date = new Date(!!dr["UpdatedDate"].toString()
                            ? dr["UpdatedDate"].toString().substring(0, 4) + "-" + dr["UpdatedDate"].toString().substring(4, 2) + "-" + dr["UpdatedDate"].toString().substring(6, 2)
                            : "1900-01-01");
                    }

                    indexDocument.ispublished = true;
                    indexDocument.lastpublished_date = new Date(); // Assuming it's today's date, you can use the actual date if available.
                    indexDocument.lastQCDate = new Date(); // Assuming it's today's date, you can use the actual date if available.
                    indexDocument.isshowonsite = true;
                    indexDocument.boostpopularity = 1000;
                    indexDocument.viewcount = 10;

                    if (!!indexDocument.categories) {
                        const filteredCategory: Category[] = indexDocument.categories.filter(objCategory => {
                            const isRequiredCategory = (objCategory.id === "111050000000018392" || objCategory.id === "111050000000018393" || objCategory.id === "111050000000018400");
                            if (!!objCategory.name) objCategory.name = objCategory.name.replace(/centax /gi, "").replace("Centax ", ""); // Use regex to replace all occurrences.
                            return isRequiredCategory;
                        });
                        indexDocument.categories = filteredCategory;
                    }

                    indexDocumentList.push(indexDocument);
                    Common.writeLog("log end for actid:" + dr["mid"]);


                } catch (ex) {
                    Common.LogError(ex, "MID = " + dr["mid"]);
                    Common.writeLog("error for actid:" + ex.message);
                    console.log("error:" + dr["mid"] + ex.message);
                    Common.LogErrorId(dr["mid"].toString());
                }
            }
            console.log("Document Batch No completed:" + (i + 1) + "\r\n");
            console.log("Number of documents added for indexing: " + indexDocumentList.length + "\r\n");

            let status: string = '';
            // if (indexType === 1)
            //     status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexName, IndexDocument, docType);
            // else
            //     status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexNameStopword, IndexDocument, docType);
            // GC.Collect();

        }
    }

    // Rest of the code after processing all the batches
    //GC.Collect();
}

export async function CaseLawsIndex(dt: any, docType: number, templateid: string): Promise<number> {
    const indexDocumentList: IndexDocument[] = [];
    const batchSize = 100; // magic
    dt = dt?.Tables[0].Rows;
    console.log('dt ki length: ' + dt.length);
    console.log('')
    // console.log('dt:' + dt)
    const totalBatches = Math.ceil(dt.length / batchSize);
    console.log("Total Document Batch Started:" + totalBatches);
    let reccount = 0;

    // console.log(dt);

    for (let i = 0; i < totalBatches; i++) {
        console.log("Document Batch No started:" + i);
        const startIndex = i * batchSize;
        const endIndex = startIndex + batchSize;
        const dataRows = dt.slice(startIndex, endIndex);

        if (dataRows.length > 0) {
            reccount = dataRows.length;
            for (const dr of dataRows) {
                const objSuggest: CompletionField[] = [];

                // Use try-catch block for error handling
                try {
                    // console.log(dr['CaseAutoID']);
                    const indexDocument: IndexDocument = {} as IndexDocument;
                    indexDocument.id = dr?.['mid']?.toString().trim();
                    indexDocument.mid = dr?.['id']?.toString().trim();
                    console.log(indexDocument?.id, indexDocument?.mid)
                    indexDocument.excusdocid = dr?.['excusdocid']?.toString().trim();
                    indexDocument.templateid = templateid;
                    indexDocument.documenttype = dr?.['documenttype']?.toString()?.toLowerCase().trim();
                    indexDocument.documentformat = dr?.['documentformat']?.toString()?.toLowerCase().trim();
                    indexDocument.filenamepath = dr?.['url']?.toString().trim();
                    console.log('-----1');
                    // Check if the filenamepath is a PDF and upload to Amazon S3
                    if (dr?.['url']?.toString()?.toLowerCase()?.indexOf('.pdf') !== -1) {
                        // Use the equivalent TypeScript code for the UploadPdfFilesOnAmazonS3Bucket method.
                        // indexDocument.filenamepath = /* Your TypeScript method call here */;
                    }

                    // Use the equivalent TypeScript code for the UploadLinkFilesOnS3Centax method.
                    /* Common.UploadLinkFilesOnS3Centax(...) */

                    try {
                        // Use the equivalent TypeScript code for the UploadImageOnAmazonS3BucketCentax method.
                        /* Common.UploadImageOnAmazonS3BucketCentax(...) */
                    } catch (ex) {
                        // Handle the error
                        console.error('S3 upload error for MID = ' + dr?.['mid'], ex);
                    }

                    const year: string = dr?.['year']?.toString()?.trim();
                    if (year !== '') {
                        indexDocument.year = { id: year, name: year };
                    }

                    const objMasters: Masterinfo = {} as Masterinfo;
                    const objMasterInfo: Info = {} as Info;
                    const objAssociates: Associates = {} as Associates;

                    const caseSubjectArray: string[] | null = dr['CaseSubject']
                        ? dr?.['CaseSubject']?.toString()?.split('$')
                        : null;

                    const objsubjects: GenericInfo[] = [];
                    console.log('-----2');
                    //#region subject-master
                    if (caseSubjectArray !== null && caseSubjectArray.length > 1) {
                        for (const association of caseSubjectArray) {
                            const associations: string[] = association.split('|');

                            if (associations !== null && associations.length > 1) {
                                const objSubject: GenericInfo = {} as GenericInfo;
                                const type: string = associations[0] !== '' ? associations[1].split('^')[0]?.toLowerCase() : '';

                                if (type.trim() === 'subject') {
                                    if (typeof associations[0] === 'string' && associations[0].trim() !== '') {
                                        objSubject.id = associations[0].trim();
                                        objSubject.type = type;
                                        objSubject.name = associations[1] !== '' ? associations[1].split('^')[1].split('~')[0] : '';
                                        objSubject.shortName = '';
                                        objSubject.ordering = associations[1].split('^')[1].split('~')[1];
                                        objSubject.orderInteger = 0;
                                        objSubject.url = Common.GetUrl(objSubject.name?.toLowerCase());

                                        // Assuming objSubject.catUrls is a property of the GenericInfo class
                                        // Update this part accordingly based on the implementation of the GenericInfo class.
                                        // objSubject.catUrls = Common.CasePopularActs()[associations[0].trim()][1].split(',');

                                        objsubjects.push(objSubject);

                                        if (!!objSubject.name.trim()) {
                                            objSuggest.push({
                                                Input: [objSubject.name?.toLowerCase().trim()],
                                                Weight: 18,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                    //#endregion subject-master
                    console.log('-----3');
                    //#region cat-subcat-binding
                    const catSubCatArray: string[] = dr["categoriescentax"]
                        ? dr["categoriescentax"]?.toString().split("$")
                        : null;


                    if (catSubCatArray !== null) {
                        const objCatList: Category[] = [];
                        for (const catsubcat of catSubCatArray) {
                            if (!!catsubcat) {
                                const objCat: Category = {} as Category;
                                const objSubCat: Subcategory = {} as Subcategory;
                                const isprimarycat: number = catsubcat?.split("%")?.length > 1 ? parseInt(catsubcat?.split("%")[1]) : 0;

                                if (catsubcat.indexOf("|") > 0 && !!catsubcat) {
                                    const catidname: string[] = catsubcat?.split("|");
                                    let mainCat = "";
                                    if (catidname && catidname?.[1]) { mainCat = catidname[1].trim().split("^")[0].trim(); }

                                    // 111050000000018392 - Centax Customs
                                    // 111050000000018393 - Centax Excise & Service Tax
                                    // 111050000000018400 - Centax GST

                                    const isRequiredCategory: boolean = mainCat.includes("111050000000018392") ||
                                        mainCat.includes("111050000000018393") ||
                                        mainCat.includes("111050000000018400");

                                    mainCat = mainCat?.replace(/centax /gi, "");

                                    if (!isRequiredCategory) continue;

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objCat.id = catidname?.[1].trim().split("^")[0].trim();
                                            objCat.name = catidname?.[1].split("^")[1].trim().split("%")[0];
                                            if (objCat && objCat?.name) { objCat.url = Common.GetUrl(objCat.name?.toLowerCase()); }
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.competitionCategoryId:
                                            objCat.id = Constants.competitionCategoryId;
                                            objCat.name = Constants.competitionCategory;
                                            objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.tpCategoryId:
                                            objCat.id = Constants.tpCategoryId;
                                            objCat.name = Constants.tpCategory;
                                            objCat.url = Common.GetUrl(objCat.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.iltCategoryId:
                                            objCat.id = Constants.iltCategoryId;
                                            objCat.name = Constants.iltCategory;
                                            objCat.url = Common.GetUrl(objCat.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        default:
                                            if (catidname && catidname[0]) {
                                                objCat.id = catidname[0].trim().split("^")[0].trim();
                                                objCat.name = catidname[0].split("^")[1].trim().split("%")[0];
                                                objCat.url = Common.GetUrl(objCat.name?.toLowerCase());
                                            }
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                    }

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objSubCat.id = catidname[2].trim().split("^")[0].trim();
                                            objSubCat.name = catidname[2].split("^")[1].trim().split("%")[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name?.toLowerCase());
                                            break;
                                        case Constants.competitionCategoryId:
                                            objSubCat.id = Constants.competitionCategoryId;
                                            objSubCat.name = Constants.competitionCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name?.toLowerCase());
                                            break;
                                        case Constants.tpCategoryId:
                                            objSubCat.id = Constants.tpCategoryId;
                                            objSubCat.name = Constants.tpCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name?.toLowerCase());
                                            break;
                                        case Constants.iltCategoryId:
                                            objSubCat.id = Constants.iltCategoryId;
                                            objSubCat.name = Constants.iltCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name?.toLowerCase());
                                            break;
                                        default:
                                            objSubCat.id = catidname[1].trim().split("^")[0].trim();
                                            objSubCat.name = catidname[1].split("^")[1].trim().split("%")[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name?.toLowerCase());
                                            break;
                                    }

                                    objCat.subcategory = objSubCat;
                                } else {
                                    objCat.id = catsubcat.split("^")[0].trim();
                                    objCat.name = catsubcat.split("^")[1].trim().split("%")[0];
                                    objCat.url = Common.GetUrl(objCat.name?.toLowerCase());
                                    objCat.isprimarycat = isprimarycat;

                                    objSubCat.id = "";
                                    objSubCat.name = "";
                                    objSubCat.url = "";
                                    objCat.subcategory = objSubCat;
                                }
                                objCatList.push(objCat);
                            }
                        }
                        indexDocument.categories = objCatList;
                    }

                    //#endregion
                    console.log('-----4');
                    //#region act-associations
                    const associationArray: string[] | null = dr["actassociations"]
                        ? (dr["actassociations"] as string).split('$')
                        : null;
                    const objActs: GenericInfo[] = [];
                    const objSections: GenericInfo[] = [];
                    const objActAssociations: Associate[] = [];
                    const objSectionAssociations: Associate[] = [];
                    const sections: string[] = [];

                    if (associationArray && associationArray.length > 1) {
                        for (const association of associationArray) {
                            const associations = association.split('|');

                            if (associations && associations.length > 1) {
                                const objAct: GenericInfo = {} as GenericInfo;
                                const objSection: GenericInfo = {} as GenericInfo;
                                const objActAssociate: Associate = {} as Associate;
                                const objSectionAssociate: Associate = {} as Associate;

                                const actidsecid = associations[0].indexOf('#') !== -1 ? associations[0].trim().split('#') : null;
                                const type = associations[1] !== "" ? associations[1].split('^')[0]?.toLowerCase() : "";

                                if (type?.toLowerCase().trim() === "act") {
                                    if (Common.CasePopularActsfinal().hasOwnProperty(associations[0].trim())) {
                                        const categories = Common.CasePopularActsfinal()[associations[0].trim()][1].split(',');
                                        objAct.id = objActAssociate.id = associations[0].trim();
                                        objAct.type = objActAssociate.type = type;
                                        objAct.name = objActAssociate.name = associations[1] !== "" ? associations[1].split('^')[1].split('~')[0] : "";
                                        objAct.shortName = "";
                                        objAct.ordering = associations[1].split('^')[1].split('~')[1];
                                        objAct.orderInteger = 0;
                                        objActAssociate.associatedDocid = "";
                                        objAct.url = objActAssociate.url = Common.GetUrl(objActAssociate.name?.toLowerCase());
                                        objAct.catUrls = categories;
                                    } else {
                                        const categories = Common.OtherActs()["999999999999999999"][1].split(',');
                                        objAct.id = "999999999999999999";
                                        objAct.type = type;
                                        objAct.name = "Other Acts";
                                        objAct.shortName = "";
                                        objAct.ordering = "999999999";
                                        objAct.orderInteger = 0;
                                        objAct.url = Common.GetUrl(objAct.name?.toLowerCase());
                                        objAct.catUrls = categories;
                                        objActAssociate.id = associations[0].trim();
                                        objActAssociate.type = type;
                                        objActAssociate.name = associations[1] !== "" ? associations[1].split('^')[1].split('~')[0] : "";
                                        objActAssociate.ordering = associations[1].split('^')[1].split('~')[1];
                                        objActAssociate.associatedDocid = "";
                                        objActAssociate.url = Common.GetUrl(objActAssociate.name?.toLowerCase());
                                    }

                                    if (objAct.name.trim() !== "") {
                                        objSuggest.push({
                                            Input: [objAct.name?.toLowerCase().trim()],
                                            Weight: 20,
                                        });
                                    }

                                    objActs.push(objAct);
                                    objActAssociations.push(objActAssociate);
                                } else {
                                    const objSByte = Number(associations[1] !== "" ? associations[1].split('^')[1][0] : "");
                                    let section = associations[1] !== "" ? associations[1].split('^')[1] : "";

                                    if (section && !isNaN(objSByte)) {
                                        section = "Section - " + section;
                                    }

                                    if (actidsecid && actidsecid[1]) {
                                        const parentsectioininfo = dr["parentsectioninfo"]
                                            ? (dr["parentsectioninfo"] as string).split('$')
                                            : null;
                                        let isparentsection = false;

                                        if (parentsectioininfo) {
                                            for (const parentsection of parentsectioininfo) {
                                                if (parentsection.indexOf(actidsecid[1].trim()) !== -1) {
                                                    const parentsectionidname = parentsection.substring(parentsection.indexOf('#')).split('|');
                                                    objSectionAssociate.id = parentsectionidname[0]?.replace('#', ' ').trim();
                                                    objSectionAssociate.name = parentsectionidname[1]?.replace('^', '-').split('~')[0];
                                                    objSectionAssociate.ordering = parentsectionidname[1]?.replace('^', '-').split('~')[1];
                                                    objSectionAssociate.actsectionid = actidsecid[0].trim() + parentsectionidname[0]?.replace('#', ' ').trim();
                                                    isparentsection = true;
                                                }
                                            }
                                        }

                                        const sectionName = section.indexOf('~') !== -1 ? section.split('~')[0].trim() : section.trim();

                                        if (sectionName) {
                                            if (Common.CasePopularActsfinal().hasOwnProperty(actidsecid[0].trim())) {
                                                objSection.id = actidsecid[1];
                                                objSection.pid = actidsecid[0];
                                                objSection.actsectionid = actidsecid[0] + actidsecid[1];
                                                objSection.type = type;
                                                objSection.name = sectionName;
                                                objSection.shortName = "";
                                                objSection.ordering = section.indexOf('~') !== -1 ? section.split('~')[1] : "";
                                                objSection.orderInteger = 0;
                                                objSection.url = Common.GetUrl(objSection.name?.toLowerCase());

                                                if (!isparentsection) {
                                                    objSectionAssociate.id = actidsecid[1];
                                                    objSectionAssociate.name = sectionName;
                                                    objSectionAssociate.ordering = section.indexOf('~') !== -1 ? section.split('~')[1] : "";
                                                    objSectionAssociate.actsectionid = actidsecid[0].trim() + actidsecid[1].trim();
                                                }

                                                objSectionAssociate.type = type;
                                                objSectionAssociate.associatedDocid = actidsecid[0];
                                                objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name?.toLowerCase());
                                            } else {
                                                if (sectionName) {
                                                    if (!isparentsection) {
                                                        objSectionAssociate.id = actidsecid[1];
                                                        objSectionAssociate.name = sectionName;
                                                        objSectionAssociate.ordering = section.indexOf('~') !== -1 ? section.split('~')[1] : "";
                                                        objSectionAssociate.actsectionid = actidsecid[0].trim() + actidsecid[1].trim();
                                                    }

                                                    objSectionAssociate.type = type;
                                                    objSectionAssociate.associatedDocid = actidsecid[0];
                                                    objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name?.toLowerCase());
                                                }
                                            }

                                            if (objSection.name.trim() !== "") {
                                                sections.push(objSection.name?.toLowerCase().trim());
                                            }

                                            objSections.push(objSection);
                                            objSectionAssociations.push(objSectionAssociate);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (sections.length > 0) {
                        objSuggest.push({
                            Input: sections,
                            Weight: 1,
                        });
                    }

                    const caactsectionsarray = dr["CaComparison"] ? (dr["CaComparison"] as string).split('$') : null;
                    const obj1956sections: casections[] = [];

                    if (caactsectionsarray && caactsectionsarray.length > 1) {
                        for (const caassociation of caactsectionsarray) {
                            const obj1956section: casections = {} as casections;
                            const caassociations = caassociation.split('|');

                            if (caassociations && caassociations.length > 1) {
                                const caactssections = caassociation.split('|');
                                const ca1956actsection = caactssections[0].split('^');

                                if (ca1956actsection) {
                                    obj1956section.id = ca1956actsection[2].trim();
                                    obj1956section.name = ca1956actsection[3].trim()?.replace(' ', '-');
                                    obj1956section.actname = "Companies Act, 1956";
                                    obj1956section.url = Common.GetUrl(obj1956section.name?.toLowerCase());
                                }

                                const obj2013sections: ca2013section[] = [];

                                for (const actsection of caactssections) {
                                    const actsections = actsection.split('^');

                                    if (actsection.indexOf("102010000000000793") !== -1) {
                                        const obj2013section: ca2013section = {} as ca2013section;
                                        obj2013section.id = actsections[2].trim();
                                        obj2013section.name = actsections[3].trim()?.replace(' ', '-');
                                        obj2013section.actname = "Companies Act, 2013";
                                        obj2013section.url = Common.GetUrl(obj2013section.name?.toLowerCase());
                                        obj2013sections.push(obj2013section);
                                    }
                                }

                                obj1956section.ca2013section = obj2013sections;
                                obj1956sections.push(obj1956section);
                            }
                        }
                    }

                    objAssociates.act = objActAssociations;
                    objAssociates.section = objSectionAssociations;
                    // indexDocument.associates = objAssociates;
                    objMasterInfo.act = objActs;
                    objMasterInfo.section = objSections;
                    objMasterInfo.subject = objsubjects;
                    objMasters.info = objMasterInfo;
                    //#endregion
                    console.log('-----5');
                    //#region article-subject-binding
                    const objSubjectAssociations: Associate[] = [];
                    const associatesStr = dr["associates"]?.toString();

                    if (!!associatesStr && associatesStr.indexOf('$') !== -1) {
                        const associatesList = associatesStr.split('$');

                        for (const association of associatesList) {
                            const associates = association.split('^');

                            if (associates) {

                                const objSubjectAssociate: Associate = {
                                    id: associates[0].trim(),
                                    name: associates[1].split('~')[0],
                                    ordering: associates[1].split('~')[1],
                                    type: "subject",
                                    url: Common.GetUrl(associates[1].split('~')[0]),
                                    associatedDocid: ""
                                } as Associate;

                                objSubjectAssociations.push(objSubjectAssociate);
                            }
                        }
                    }
                    else if (!!associatesStr && associatesStr.indexOf('$') === -1) {
                        const associates = associatesStr.split('^');

                        if (associates) {
                            const objSubjectAssociate: Associate = {
                                id: associates[0].trim(),
                                name: associates[1].split('~')[0],
                                ordering: associates[1].split('~')[1],
                                type: "subject",
                                url: Common.GetUrl(associates[1].split('~')[0]),
                                associatedDocid: ""
                            } as Associate;

                            objSubjectAssociations.push(objSubjectAssociate);
                        }
                    }

                    objAssociates.subject = objSubjectAssociations;
                    //#endregion
                    console.log('-----6');
                    //#region rule associations
                    const ruleAssociationArray = (dr["DDA_Rules"] !== null && dr["DDA_Rules"] !== undefined && dr["DDA_Rules"]?.toString() !== "")
                        ? dr["DDA_Rules"]?.toString().split('$')
                        : null;

                    if (ruleAssociationArray !== null && ruleAssociationArray.length > 1) {
                        const objRuleAssociations: Associate[] = [];
                        const objRuleNoAssociations: Associate[] = [];

                        for (const association of ruleAssociationArray) {
                            const associations = association.split('|');

                            if (associations !== null && associations.length > 1) {
                                const objRuleAssociate: Associate = {} as Associate;
                                const objRulenoAssociate: Associate = {} as Associate;

                                const ruleidrulenoid = (associations[0]?.toString().indexOf('#') !== -1)
                                    ? associations[0]?.toString().trim().split('#')
                                    : null;

                                const type = (associations[0] !== "") ? associations[1].split('^')[0]?.toLowerCase() : "";

                                if (type?.toLowerCase().trim() === "rule") {
                                    if (associations[0] !== "") {
                                        objRuleAssociate.id = associations[0].trim();
                                        objRuleAssociate.type = type;
                                        objRuleAssociate.name = (associations[1] !== "") ? associations[1].split('^')[1] : "";
                                        objRuleAssociate.associatedDocid = "";
                                        objRuleAssociate.url = Common.GetUrl(objRuleAssociate.name?.toLowerCase());
                                        objRuleAssociations.push(objRuleAssociate);
                                    }
                                } else {
                                    let objSByte: number;
                                    let ruleno = (associations[1] !== "") ? associations[1].split('^')[1] : "";

                                    if (ruleno !== "" && !isNaN(Number(ruleno.substring(0, 1)))) {
                                        ruleno = "Rule - " + ruleno;
                                    }

                                    if (ruleidrulenoid !== null && ruleidrulenoid[1] !== "") {
                                        objRulenoAssociate.id = ruleidrulenoid[1];
                                        objRulenoAssociate.type = type;
                                        objRulenoAssociate.name = ruleno;
                                        objRulenoAssociate.associatedDocid = ruleidrulenoid[0];
                                        objRulenoAssociate.url = Common.GetUrl(objRulenoAssociate.name?.toLowerCase());
                                        objRuleNoAssociations.push(objRulenoAssociate);
                                    }
                                }
                            }
                        }

                        objAssociates.rule = objRuleAssociations;
                        objAssociates.ruleno = objRuleNoAssociations;
                    }

                    //#endregion
                    console.log('-----7');
                    //#region case referred associations 

                    const casereferredAssociation = (dr["casereferred"] !== null && dr["casereferred"] !== undefined && dr["casereferred"]?.toString() !== "")
                        ? dr["casereferred"]?.toString().split('$')
                        : null;

                    if (casereferredAssociation !== null && casereferredAssociation.length > 1) {
                        const objCaseReferredAssociations: Associate[] = [];

                        for (const association of casereferredAssociation) {
                            const associations = association.split('^');

                            if (associations !== null && associations.length > 1) {
                                const objCaseRefAssociate: Associate = {} as Associate; // Initialize as an empty object of type Associate

                                const idtype = (associations[0]?.toString().indexOf('|') !== -1)
                                    ? associations[0]?.toString().trim().split('|')
                                    : null;

                                const namedate = (associations[1]?.toString().indexOf('#') !== -1)
                                    ? associations[1].split('#')
                                    : null;

                                if (idtype !== null && idtype[1] !== "") {
                                    objCaseRefAssociate.id = idtype[0];
                                    objCaseRefAssociate.type = idtype[1];
                                    objCaseRefAssociate.name = (namedate[0] !== "") ? namedate[0] : "";
                                    objCaseRefAssociate.date = (namedate[1].indexOf('@') !== -1)
                                        ? Common.converttoyymmdd(namedate[1].split('@')[0])
                                        : "";

                                    objCaseRefAssociate.courtshortname = (namedate[1].indexOf('@') !== -1)
                                        ? namedate[1].split('@')[1].split('%')[1]
                                        : "";

                                    objCaseRefAssociate.subheading = (namedate[1].indexOf('@') !== -1)
                                        ? namedate[1].split('@')[1].split('%')[0]
                                        : "";

                                    if (!!indexDocument && !!indexDocument?.mid) objCaseRefAssociate.associatedDocid = indexDocument.mid;
                                    objCaseRefAssociate.url = Common.GetUrl(objCaseRefAssociate.name?.toLowerCase());
                                    objCaseReferredAssociations.push(objCaseRefAssociate);
                                }
                            }
                        }

                        objAssociates.casereferred = objCaseReferredAssociations;
                    }


                    //#endregion
                    console.log('-----8');
                    //#region case referred associations

                    const affirmreverseAssociation = (!!(dr["arinfo"]))
                        ? dr["arinfo"]?.toString().split('$')
                        : null;

                    if (affirmreverseAssociation !== null && affirmreverseAssociation.length > 1) {
                        const objaffirmreverseAssociations: Associate[] = [];

                        for (const association of affirmreverseAssociation) {
                            if (association === null || association === "") {
                                continue;
                            }

                            const associations = association.split('^');

                            if (associations !== null && associations.length > 1) {
                                const objaffirmReverseAssociate: Associate = {} as Associate;

                                const idtype = (associations[0].indexOf('|') !== -1)
                                    ? associations[0].trim().split('|')
                                    : null;

                                const namedate = (associations[1].indexOf('#') !== -1)
                                    ? associations[1].split('#')
                                    : null;

                                if (idtype === null || namedate === null) {
                                    const a: string = "";
                                }

                                if (idtype !== null && idtype[1] !== "") {
                                    objaffirmReverseAssociate.id = idtype[0].trim();
                                    objaffirmReverseAssociate.type = idtype[1];
                                    objaffirmReverseAssociate.name = namedate !== null ? (namedate[0] !== "" ? namedate[0] : "") : "";
                                    objaffirmReverseAssociate.date = namedate !== null
                                        ? (namedate[1].indexOf('@') !== -1 ? Common.converttoyymmdd(namedate[1].split('@')[0].split('%')[0]) : "")
                                        : "";

                                    objaffirmReverseAssociate.courtshortname = namedate !== null
                                        ? (namedate[1].indexOf('@') !== -1 ? namedate[1].split('@')[0].split('%')[1] : "")
                                        : "";

                                    objaffirmReverseAssociate.subheading = namedate !== null
                                        ? (namedate[1].indexOf('@') !== -1 ? namedate[1].split('@')[1].split('~')[0] : "")
                                        : "";

                                    objaffirmReverseAssociate.associatedDocid = namedate !== null
                                        ? (namedate[1].indexOf('@') !== -1 ? namedate[1].split('@')[1].split('~')[1] : "")
                                        : "";

                                    objaffirmReverseAssociate.url = Common.GetUrl(objaffirmReverseAssociate.name?.toLowerCase());
                                    objaffirmreverseAssociations.push(objaffirmReverseAssociate);
                                }
                            }
                        }

                        objAssociates.affirmreverse = objaffirmreverseAssociations;
                    }

                    //#endregion
                    console.log('-----10');
                    //#region case referred associations

                    const slpAssociation = (dr["slpinfo"] !== null && dr["slpinfo"] !== undefined && dr["slpinfo"]?.toString() !== "")
                        ? dr["slpinfo"]?.toString().split('$')
                        : null;

                    if (slpAssociation !== null && slpAssociation.length > 1) {
                        const slpAssociations: Associate[] = [];

                        for (const association of slpAssociation) {
                            const associations = association.split('^');

                            if (associations !== null && associations.length > 1) {
                                const objslpAssociate: Associate = {} as Associate; // Initialize as an empty object of type Associate

                                const nameSubheading = (associations[0].indexOf('|') !== -1)
                                    ? associations[0].trim().split('|')
                                    : null;

                                const affirmCaseIds = (associations[1].indexOf('@') !== -1)
                                    ? associations[1].split('@')
                                    : null;

                                if (nameSubheading !== null && !!nameSubheading[1]) {
                                    objslpAssociate.id = affirmCaseIds[0];
                                    objslpAssociate.type = nameSubheading[0];
                                    objslpAssociate.name = (nameSubheading[0] !== "") ? nameSubheading[0] : "";
                                    objslpAssociate.subheading = (nameSubheading[1] !== "") ? nameSubheading[1] : "";
                                    objslpAssociate.associatedDocid = affirmCaseIds[1];
                                    objslpAssociate.url = Common.GetUrl(objslpAssociate.name?.toLowerCase());
                                    slpAssociations.push(objslpAssociate);
                                }
                            }
                        }

                        objAssociates.slp = slpAssociations;
                    }


                    //#endregion
                    console.log('----11');
                    //#region cirnot association

                    const cirnotAssociation = (dr["DDA_CirNot"] !== null && dr["DDA_CirNot"] !== undefined && dr["DDA_CirNot"]?.toString().trim() !== "")
                        ? dr["DDA_CirNot"]?.toString().split('$')
                        : null;


                    if (cirnotAssociation !== null && cirnotAssociation.length > 1) {
                        const objcirnotAssociations: Associate[] = [];

                        for (const association of cirnotAssociation) {
                            const objcirnotAssociate: Associate = {} as Associate;

                            const associations = association.split('|');
                            if (associations !== null && associations.length > 1) {
                                objcirnotAssociate.id = associations[0].trim();
                                objcirnotAssociate.type = associations[1].split('^')[0].trim()?.toLowerCase();
                                objcirnotAssociate.name = associations[1].split('^')[1].trim();
                                objcirnotAssociate.date = associations[1].split('^')[2].trim();
                                objcirnotAssociate.subheading = associations[1].split('^')[3].trim();
                                objcirnotAssociations.push(objcirnotAssociate);
                            }
                        }

                        objAssociates.cirnot = objcirnotAssociations;
                    }

                    indexDocument.associates = objAssociates;
                    //#endregion
                    console.log('----12');
                    //#region Groups Section
                    const groupsArray = (dr["groups"] !== null && dr["groups"] !== undefined && dr["groups"]?.toString().trim() !== "")
                        ? dr["groups"]?.toString()?.replace('|', ' ').trim().split('^')
                        : null;


                    if (groupsArray !== null) {
                        const objGroups: Groups = {} as Groups;
                        objGroups.group = {
                            id: groupsArray[0].split('^')[0].trim(),
                            name: groupsArray[1].trim(),
                            url: Common.GetUrl(groupsArray[1]?.toLowerCase().trim()),
                            subgroup: {
                                id: "",
                                name: "",
                                subsubgroup: {},
                                url: "",
                            },
                        };

                        indexDocument.groups = objGroups;
                    }

                    //#endregion

                    //#region sortbycitation

                    const objCitationsort: Citation = {} as Citation;
                    const objYearsort: citationinfo = {} as citationinfo;
                    const objJournalsort: citationinfo = {} as citationinfo;
                    const objVolumesort: citationinfo = {} as citationinfo;
                    const objPagesort: citationinfo = {} as citationinfo;
                    const objSortByCitation: FormattedCitation = {} as FormattedCitation;

                    const yearJournalVolumePageMaster = (!!dr["MasterCitationOrder"])
                        ? dr["MasterCitationOrder"]?.toString().split('|')
                        : null;

                    if (yearJournalVolumePageMaster !== null) {
                        if (yearJournalVolumePageMaster[0] !== null) {
                            objYearsort.id = yearJournalVolumePageMaster[0];
                            objYearsort.name = yearJournalVolumePageMaster[0];
                            objYearsort.shortName = yearJournalVolumePageMaster[0];
                            objYearsort.ordering = yearJournalVolumePageMaster[0];
                            objYearsort.type = "year";
                            objYearsort.url = Common.GetUrl(objYearsort.name);
                            // objCitation.year = objYearsort;
                        }
                        if (yearJournalVolumePageMaster[1] !== null) {
                            const idName = yearJournalVolumePageMaster[1].split('^');
                            objJournalsort.id = idName[0];
                            objJournalsort.name = idName[1];
                            objJournalsort.shortName = idName[1];
                            objJournalsort.ordering = idName[1]?.toLowerCase();
                            objJournalsort.type = "journal";
                            objJournalsort.url = Common.GetUrl(objJournalsort.name);
                            // objCitation.journal = objJournalsort;
                        }
                        if (yearJournalVolumePageMaster[2] !== null) {
                            objVolumesort.id = yearJournalVolumePageMaster[2];
                            objVolumesort.name = (!!yearJournalVolumePageMaster[2])
                                ? parseInt(yearJournalVolumePageMaster[2].trim(), 10)?.toString().padStart(4, '0')
                                : Common.getRepeat("?", 4);
                            objVolumesort.shortName = yearJournalVolumePageMaster[2];
                            objVolumesort.ordering = yearJournalVolumePageMaster[2];
                            objVolumesort.type = "volume";
                            objVolumesort.url = Common.GetUrl(objVolumesort.name);
                            // objCitation.volume = objVolume;
                        }
                        if (yearJournalVolumePageMaster[3] !== null) {
                            objPagesort.id = yearJournalVolumePageMaster[3];
                            objPagesort.name = (!!yearJournalVolumePageMaster[3])
                                ? yearJournalVolumePageMaster[3].trim().padStart(7, '0')
                                : Common.getRepeat("?", 7);
                            objPagesort.shortName = yearJournalVolumePageMaster[3];
                            objPagesort.ordering = yearJournalVolumePageMaster[3];
                            objPagesort.type = "page";
                            objPagesort.url = Common.GetUrl(objPagesort.name);
                            // objCitation.pageno = objPagesort;
                        }
                    } else {
                        objYearsort.name = "0000";
                        objJournalsort.id = "000000000000000000";
                        objVolumesort.name = "0000";
                        objPagesort.name = "00000000";
                    }


                    //#endregion

                    //#region sortbycitationcentax

                    const objCitationsortcentax: Citation = {} as Citation;
                    const objYearsortcentax: citationinfo = {} as citationinfo;
                    const objJournalsortcentax: citationinfo = {} as citationinfo;
                    const objVolumesortcentax: citationinfo = {} as citationinfo;
                    const objPagesortcentax: citationinfo = {} as citationinfo;
                    const objSortByCitationcentax: FormattedCitation = {} as FormattedCitation;

                    const yearJournalVolumePageMastercentax = (!!dr["MasterCitationOrderCentax"])
                        ? dr["MasterCitationOrderCentax"]?.toString().split('|')
                        : null;

                    if (yearJournalVolumePageMastercentax !== null) {
                        if (yearJournalVolumePageMastercentax[0] !== null) {
                            objYearsortcentax.id = yearJournalVolumePageMastercentax[0];
                            objYearsortcentax.name = yearJournalVolumePageMastercentax[0];
                            objYearsortcentax.shortName = yearJournalVolumePageMastercentax[0];
                            objYearsortcentax.ordering = yearJournalVolumePageMastercentax[0];
                            objYearsortcentax.type = "year";
                            objYearsortcentax.url = Common.GetUrl(objYearsortcentax.name);
                            //objCitationsortcentax.year = objYearsortcentax;
                        }
                        if (yearJournalVolumePageMastercentax[1] !== null) {
                            const idName = yearJournalVolumePageMastercentax[1].split('^');
                            objJournalsortcentax.id = idName[0];
                            objJournalsortcentax.name = idName[1];
                            objJournalsortcentax.shortName = idName[1];
                            objJournalsortcentax.ordering = idName[1]?.toLowerCase();
                            objJournalsortcentax.type = "journal";
                            objJournalsortcentax.url = Common.GetUrl(objJournalsort.name);
                            //objCitationsortcentax.journal = objJournalsort;
                        }
                        if (yearJournalVolumePageMastercentax[2] !== null) {
                            objVolumesortcentax.id = yearJournalVolumePageMastercentax[2];
                            objVolumesortcentax.name = (!yearJournalVolumePageMastercentax[2])
                                ? Number(yearJournalVolumePageMastercentax[2].trim())?.toString().padStart(4, '0')
                                : Common.getRepeat("?", 4);
                            objVolumesortcentax.shortName = yearJournalVolumePageMastercentax[2];
                            objVolumesortcentax.ordering = yearJournalVolumePageMastercentax[2];
                            objVolumesortcentax.type = "volume";
                            objVolumesortcentax.url = Common.GetUrl(objVolumesort.name);
                            // objCitationsortcentax.volume = objVolume;
                        }
                        if (yearJournalVolumePageMastercentax[3] !== null) {
                            objPagesortcentax.id = yearJournalVolumePageMastercentax[3];
                            objPagesortcentax.name = (!yearJournalVolumePageMastercentax[3])
                                ? yearJournalVolumePageMastercentax[3].trim().padStart(7, '0')
                                : Common.getRepeat("?", 7);
                            objPagesortcentax.shortName = yearJournalVolumePageMastercentax[3];
                            objPagesortcentax.ordering = yearJournalVolumePageMastercentax[3];
                            objPagesortcentax.type = "page";
                            objPagesortcentax.url = Common.GetUrl(objPagesort.name);
                            // objCitationsortcentax.pageno = objPagesort;
                        }
                    } else {
                        objYearsortcentax.name = "0000";
                        objJournalsortcentax.id = "000000000000000000";
                        objVolumesortcentax.name = "0000";
                        objPagesortcentax.name = "00000000";
                    }

                    //#endregion

                    //#region sortbycitationcentaxelt

                    const objCitationsortcentaxelt: Citation = {} as Citation;
                    const objYearsortcentaxelt: citationinfo = {} as citationinfo;
                    const objJournalsortcentaxelt: citationinfo = {} as citationinfo;
                    const objVolumesortcentaxelt: citationinfo = {} as citationinfo;
                    const objPagesortcentaxelt: citationinfo = {} as citationinfo;
                    const objSortByCitationcentaxelt: FormattedCitation = {} as FormattedCitation;

                    const yearJournalVolumePageMastercentaxelt: string[] | null = dr["MasterCitationOrderCentaxElt"] !== null && dr["MasterCitationOrderCentaxElt"] !== undefined && dr["MasterCitationOrderCentaxElt"]?.toString() !== ""
                        ? dr["MasterCitationOrderCentaxElt"]?.toString().split('|')
                        : null;

                    if (yearJournalVolumePageMastercentaxelt !== null) {
                        if (yearJournalVolumePageMastercentaxelt[0] !== null) {
                            objYearsortcentaxelt.id = yearJournalVolumePageMastercentaxelt[0];
                            objYearsortcentaxelt.name = yearJournalVolumePageMastercentaxelt[0];
                            objYearsortcentaxelt.shortName = yearJournalVolumePageMastercentaxelt[0];
                            objYearsortcentaxelt.ordering = yearJournalVolumePageMastercentaxelt[0];
                            objYearsortcentaxelt.type = "year";
                            objYearsortcentaxelt.url = Common.GetUrl(objYearsortcentaxelt.name);
                        }

                        if (yearJournalVolumePageMastercentaxelt[1] !== null) {
                            const idName: string[] = yearJournalVolumePageMastercentaxelt[1].split('^');
                            objJournalsortcentaxelt.id = idName[0];
                            objJournalsortcentaxelt.name = idName[1];
                            objJournalsortcentaxelt.shortName = idName[1];
                            objJournalsortcentaxelt.ordering = idName[1]?.toLowerCase();
                            objJournalsortcentaxelt.type = "journal";
                            objJournalsortcentaxelt.url = Common.GetUrl(objJournalsortcentaxelt.name);
                        }

                        if (yearJournalVolumePageMastercentaxelt[2] !== null) {
                            objVolumesortcentaxelt.id = yearJournalVolumePageMastercentaxelt[2];
                            objVolumesortcentaxelt.name = yearJournalVolumePageMastercentaxelt[2].trim() !== "" ? Number(yearJournalVolumePageMastercentaxelt[2].trim())?.toString().padStart(4, '0') : Common.getRepeat("?", 4);
                            objVolumesortcentaxelt.shortName = yearJournalVolumePageMastercentaxelt[2];
                            objVolumesortcentaxelt.ordering = yearJournalVolumePageMastercentaxelt[2];
                            objVolumesortcentaxelt.type = "volume";
                            objVolumesortcentaxelt.url = Common.GetUrl(objVolumesortcentaxelt.name);
                        }

                        if (yearJournalVolumePageMastercentaxelt[3] !== null) {
                            objPagesortcentaxelt.id = yearJournalVolumePageMastercentaxelt[3];
                            objPagesortcentaxelt.name = yearJournalVolumePageMastercentaxelt[3].trim() !== "" ? yearJournalVolumePageMastercentaxelt[3].trim().padStart(7, '0') : Common.getRepeat("?", 7);
                            objPagesortcentaxelt.shortName = yearJournalVolumePageMastercentaxelt[3];
                            objPagesortcentaxelt.ordering = yearJournalVolumePageMastercentaxelt[3];
                            objPagesortcentaxelt.type = "page";
                            objPagesortcentaxelt.url = Common.GetUrl(objPagesortcentaxelt.name);
                        }
                    } else {
                        objYearsortcentaxelt.name = "0000";
                        objJournalsortcentaxelt.id = "000000000000000000";
                        objVolumesortcentaxelt.name = "0000";
                        objPagesortcentaxelt.name = "00000000";
                    }

                    //#endregion

                    //#region sortbycitationcentaxgstl

                    const objCitationsortcentaxgstl: Citation = {} as Citation;
                    const objYearsortcentaxgstl: citationinfo = {} as citationinfo;
                    const objJournalsortcentaxgstl: citationinfo = {} as citationinfo;
                    const objVolumesortcentaxgstl: citationinfo = {} as citationinfo;
                    const objPagesortcentaxgstl: citationinfo = {} as citationinfo;
                    const objSortByCitationcentaxgstl: FormattedCitation = {} as FormattedCitation;

                    const yearJournalVolumePageMastercentaxgstl: string[] | null = dr["MasterCitationOrderCentaxGstl"] !== null && dr["MasterCitationOrderCentaxGstl"] !== undefined && dr["MasterCitationOrderCentaxGstl"]?.toString() !== ""
                        ? dr["MasterCitationOrderCentaxGstl"]?.toString().split('|')
                        : null;

                    if (yearJournalVolumePageMastercentaxgstl !== null) {
                        if (yearJournalVolumePageMastercentaxgstl[0] !== null) {
                            objYearsortcentaxgstl.id = yearJournalVolumePageMastercentaxgstl[0];
                            objYearsortcentaxgstl.name = yearJournalVolumePageMastercentaxgstl[0];
                            objYearsortcentaxgstl.shortName = yearJournalVolumePageMastercentaxgstl[0];
                            objYearsortcentaxgstl.ordering = yearJournalVolumePageMastercentaxgstl[0];
                            objYearsortcentaxgstl.type = "year";
                            objYearsortcentaxgstl.url = Common.GetUrl(objYearsortcentaxgstl.name);
                        }

                        if (yearJournalVolumePageMastercentaxgstl[1] !== null) {
                            const idName: string[] = yearJournalVolumePageMastercentaxgstl[1].split('^');
                            objJournalsortcentaxgstl.id = idName[0];
                            objJournalsortcentaxgstl.name = idName[1];
                            objJournalsortcentaxgstl.shortName = idName[1];
                            objJournalsortcentaxgstl.ordering = idName[1]?.toLowerCase();
                            objJournalsortcentaxgstl.type = "journal";
                            objJournalsortcentaxgstl.url = Common.GetUrl(objJournalsortcentaxgstl.name);
                        }

                        if (yearJournalVolumePageMastercentaxgstl[2] !== null) {
                            objVolumesortcentaxgstl.id = yearJournalVolumePageMastercentaxgstl[2];
                            objVolumesortcentaxgstl.name = yearJournalVolumePageMastercentaxgstl[2].trim() !== "" ? Number(yearJournalVolumePageMastercentaxgstl[2].trim())?.toString().padStart(4, '0') : Common.getRepeat("?", 4);
                            objVolumesortcentaxgstl.shortName = yearJournalVolumePageMastercentaxgstl[2];
                            objVolumesortcentaxgstl.ordering = yearJournalVolumePageMastercentaxgstl[2];
                            objVolumesortcentaxgstl.type = "volume";
                            objVolumesortcentaxgstl.url = Common.GetUrl(objVolumesortcentaxgstl.name);
                        }

                        if (yearJournalVolumePageMastercentaxgstl[3] !== null) {
                            objPagesortcentaxgstl.id = yearJournalVolumePageMastercentaxgstl[3];
                            objPagesortcentaxgstl.name = yearJournalVolumePageMastercentaxgstl[3].trim() !== "" ? yearJournalVolumePageMastercentaxgstl[3].trim().padStart(7, '0') : Common.getRepeat("?", 7);
                            objPagesortcentaxgstl.shortName = yearJournalVolumePageMastercentaxgstl[3];
                            objPagesortcentaxgstl.ordering = yearJournalVolumePageMastercentaxgstl[3];
                            objPagesortcentaxgstl.type = "page";
                            objPagesortcentaxgstl.url = Common.GetUrl(objPagesortcentaxgstl.name);
                        }
                    } else {
                        objYearsortcentaxgstl.name = "0000";
                        objJournalsortcentaxgstl.id = "000000000000000000";
                        objVolumesortcentaxgstl.name = "0000";
                        objPagesortcentaxgstl.name = "00000000";
                    }

                    //#endregion

                    //#region sortbycitationcentaxstr

                    const objCitationsortcentaxstr: Citation = {} as Citation;
                    const objYearsortcentaxstr: citationinfo = {} as citationinfo;
                    const objJournalsortcentaxstr: citationinfo = {} as citationinfo;
                    const objVolumesortcentaxstr: citationinfo = {} as citationinfo;
                    const objPagesortcentaxstr: citationinfo = {} as citationinfo;
                    const objSortByCitationcentaxstr: FormattedCitation = {} as FormattedCitation;

                    const yearJournalVolumePageMastercentaxstr: string[] | null = dr["MasterCitationOrderCentaxStr"] !== null && dr["MasterCitationOrderCentaxStr"] !== undefined && dr["MasterCitationOrderCentaxStr"]?.toString() !== ""
                        ? dr["MasterCitationOrderCentaxStr"]?.toString().split('|')
                        : null;

                    if (yearJournalVolumePageMastercentaxstr !== null) {
                        if (yearJournalVolumePageMastercentaxstr[0] !== null) {
                            objYearsortcentaxstr.id = yearJournalVolumePageMastercentaxstr[0];
                            objYearsortcentaxstr.name = yearJournalVolumePageMastercentaxstr[0];
                            objYearsortcentaxstr.shortName = yearJournalVolumePageMastercentaxstr[0];
                            objYearsortcentaxstr.ordering = yearJournalVolumePageMastercentaxstr[0];
                            objYearsortcentaxstr.type = "year";
                            objYearsortcentaxstr.url = Common.GetUrl(objYearsortcentaxstr.name);
                        }

                        if (yearJournalVolumePageMastercentaxstr[1] !== null) {
                            const idName: string[] = yearJournalVolumePageMastercentaxstr[1].split('^');
                            objJournalsortcentaxstr.id = idName[0];
                            objJournalsortcentaxstr.name = idName[1];
                            objJournalsortcentaxstr.shortName = idName[1];
                            objJournalsortcentaxstr.ordering = idName[1]?.toLowerCase();
                            objJournalsortcentaxstr.type = "journal";
                            objJournalsortcentaxstr.url = Common.GetUrl(objJournalsort.name);
                        }

                        if (yearJournalVolumePageMastercentaxstr[2] !== null) {
                            objVolumesortcentaxstr.id = yearJournalVolumePageMastercentaxstr[2];
                            objVolumesortcentaxstr.name = yearJournalVolumePageMastercentaxstr[2].trim() !== "" ? Number(yearJournalVolumePageMastercentaxstr[2].trim())?.toString().padStart(4, '0') : Common.getRepeat("?", 4);
                            objVolumesortcentaxstr.shortName = yearJournalVolumePageMastercentaxstr[2];
                            objVolumesortcentaxstr.ordering = yearJournalVolumePageMastercentaxstr[2];
                            objVolumesortcentaxstr.type = "volume";
                            objVolumesortcentaxstr.url = Common.GetUrl(objVolumesort.name);
                        }

                        if (yearJournalVolumePageMastercentaxstr[3] !== null) {
                            objPagesortcentaxstr.id = yearJournalVolumePageMastercentaxstr[3];
                            objPagesortcentaxstr.name = yearJournalVolumePageMastercentaxstr[3].trim() !== "" ? yearJournalVolumePageMastercentaxstr[3].trim().padStart(7, '0') : Common.getRepeat("?", 7);
                            objPagesortcentaxstr.shortName = yearJournalVolumePageMastercentaxstr[3];
                            objPagesortcentaxstr.ordering = yearJournalVolumePageMastercentaxstr[3];
                            objPagesortcentaxstr.type = "page";
                            objPagesortcentaxstr.url = Common.GetUrl(objPagesort.name);
                        }
                    } else {
                        objYearsortcentaxstr.name = "0000";
                        objJournalsortcentaxstr.id = "000000000000000000";
                        objVolumesortcentaxstr.name = "0000";
                        objPagesortcentaxstr.name = "00000000";
                    }

                    //#endregion
                    console.log('----13');
                    indexDocument.companyactinfo = obj1956sections;
                    indexDocument.documentdate = !!dr["documentdate"]?.toString().split('^')[0] ? dr["documentdate"]?.toString().split('^')[0] : "19000101";
                    indexDocument.formatteddocumentdate = new Date(!!indexDocument.documentdate ? indexDocument.documentdate.substring(0, 4) + "-" + indexDocument.documentdate.substring(4, 2) + "-" + indexDocument.documentdate.substring(6, 2) : "1900-01-01");
                    indexDocument.displaydocumentdatestring = !!indexDocument.documentdate && indexDocument.documentdate.trim() !== "19000101" ? indexDocument.documentdate : "";
                    indexDocument.heading = !!indexDocument.documentdate && indexDocument.documentdate.trim() !== "19000101" ? `${dr["heading"]?.toString().trim()}[${dr["documentdate"]?.toString().split('^')[1]}]` : dr["heading"]?.toString().trim();
                    indexDocument.subheading = dr["subheading"]?.toString().trim();
                    indexDocument.sortheading = dr["sortheading"]?.toString()?.toLowerCase().trim();
                    indexDocument.sortbycourt = dr["sortbycourt"]?.toString()?.toLowerCase().trim();
                    indexDocument.sortbyname = dr["sortbyname"]?.toString()?.toLowerCase().trim();
                    indexDocument.sortbyauthor = dr["sortbyauthor"]?.toString()?.toLowerCase().trim();
                    indexDocument.sortbycitation = objYearsort.name + objJournalsort.id + objVolumesort.name + objPagesort.name;
                    indexDocument.sortbycitationcentax = objYearsortcentax.name + objJournalsortcentax.id + objVolumesortcentax.name + objPagesortcentax.name;
                    indexDocument.sortbycitationcentaxelt = objYearsortcentaxelt.name + objJournalsortcentaxelt.id + objVolumesortcentaxelt.name + objPagesortcentaxelt.name;
                    indexDocument.sortbycitationcentaxgstl = objYearsortcentaxgstl.name + objJournalsortcentaxgstl.id + objVolumesortcentaxgstl.name + objPagesortcentaxgstl.name;
                    indexDocument.sortbycitationcentaxstr = objYearsortcentaxstr.name + objJournalsortcentaxstr.id + objVolumesortcentaxstr.name + objPagesortcentaxstr.name;
                    indexDocument.sortheadingnumber = "";
                    indexDocument.searchheadingnumber = Common.RemoveSpecialCharacterWithSpace(dr["searchheadingnumber"]?.toString()?.toLowerCase().trim());
                    indexDocument.parentheadings = [{ id: "", name: "", ordering: "" }];
                    indexDocument.url = dr["url"]?.toString()?.toLowerCase().trim();
                    indexDocument.language = "";

                    //#region Master Info 

                    let objClassifications: GenericInfo[] = [];
                    let objSubClassifications: GenericInfo[] = [];
                    let subjectArray: string[] = [];
                    if (!!dr["GSTSubjectID"] && dr["GSTSubjectID"].indexOf('$') !== -1) {
                        const subjects: string[] | null = (!!dr["GSTSubjectID"]) ? dr["GSTSubjectID"].split('$') : null;
                        if (subjects) {
                            for (const subject of subjects) {
                                if (!!subject) {
                                    let objSubjectInfo: GenericInfo = {} as GenericInfo;
                                    let objSubSubjectInfo: GenericInfo = {} as GenericInfo;
                                    const subject_subsubject: string[] | null = (!!subject) ? subject.split('|') : null;
                                    if (!!subject_subsubject && subject_subsubject[1].length < 10 && subject_subsubject[0].length > 10 && dr["categoriescentax"].indexOf("111050000000016981") !== -1) {
                                        const alreadyExist: boolean = objClassifications.some(p => p.shortName === "classification of subject");
                                        if (!alreadyExist) {
                                            objSubjectInfo.id = "000000000000000000";
                                            objSubjectInfo.name = "Classification of Subject";
                                            objSubjectInfo.shortName = "Classification of Subject";
                                            objSubjectInfo.ordering = "";
                                            objSubjectInfo.type = "classification";
                                            objSubjectInfo.url = Common.GetUrl(objSubjectInfo.name);
                                            objClassifications.push(objSubjectInfo);

                                            subjectArray.push(objSubjectInfo.name.trim());
                                        }
                                        const subSubjectIdName: string[] = subject_subsubject[0].split('^');
                                        objSubSubjectInfo.id = subSubjectIdName[0].trim();
                                        objSubSubjectInfo.pid = objSubjectInfo.id;
                                        objSubSubjectInfo.name = subSubjectIdName[1];
                                        objSubSubjectInfo.shortName = subSubjectIdName[1];
                                        objSubSubjectInfo.ordering = subSubjectIdName[1];
                                        objSubSubjectInfo.type = "subclassification";
                                        objSubSubjectInfo.url = Common.GetUrl(objSubSubjectInfo.name);
                                        objSubClassifications.push(objSubSubjectInfo);

                                        subjectArray.push(objSubSubjectInfo.name.trim());
                                    } else {
                                        let classificationId: string = "";
                                        if (!!subject_subsubject && subject_subsubject[0] !== null) {
                                            const subIdName: string[] = subject_subsubject[0].split('^');
                                            classificationId = subIdName[0].trim();
                                            const alreadyExist: boolean = objClassifications.some(p => p.id === subIdName[0]);
                                            if (!alreadyExist) {
                                                objSubjectInfo.id = subIdName[0].trim();
                                                objSubjectInfo.name = subIdName[1].trim();
                                                objSubjectInfo.shortName = subIdName[1];
                                                objSubjectInfo.ordering = subIdName[1];
                                                objSubjectInfo.type = "classification";
                                                objSubjectInfo.url = Common.GetUrl(objSubjectInfo.name);
                                                objClassifications.push(objSubjectInfo);

                                                subjectArray.push(objSubjectInfo.name.trim());
                                            }
                                        }
                                        if (!!subject_subsubject && subject_subsubject[1] !== null && subject_subsubject[1].length > 5) {
                                            const subSubjectIdName: string[] = subject_subsubject[1].split('^');
                                            objSubSubjectInfo.id = subSubjectIdName[0].trim();
                                            objSubSubjectInfo.pid = classificationId;
                                            objSubSubjectInfo.name = subSubjectIdName[1];
                                            objSubSubjectInfo.shortName = subSubjectIdName[1];
                                            objSubSubjectInfo.ordering = subSubjectIdName[1];
                                            objSubSubjectInfo.type = "subclassification";
                                            objSubSubjectInfo.url = Common.GetUrl(objSubSubjectInfo.name);
                                            objSubClassifications.push(objSubSubjectInfo);

                                            subjectArray.push(objSubSubjectInfo.name.trim());
                                        } else {
                                            objSubSubjectInfo.id = "";
                                            objSubSubjectInfo.pid = "";
                                            objSubSubjectInfo.name = "";
                                            objSubSubjectInfo.shortName = "";
                                            objSubSubjectInfo.ordering = "";
                                            objSubSubjectInfo.type = "subclassification";
                                            objSubSubjectInfo.url = "";
                                            objSubClassifications.push(objSubSubjectInfo);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    let objCourtInfoes: GenericInfo[] = [];
                    const courtInfo: string[] = String(dr["court"]).split('^');
                    if (courtInfo && courtInfo.length > 1) {
                        if (!!courtInfo[0]) {
                            let objCourtinfo: GenericInfo = {} as GenericInfo;
                            objCourtinfo.id = String(courtInfo[0]).trim();
                            objCourtinfo.type = "court";
                            objCourtinfo.shortName = String(courtInfo[1]).trim();
                            objCourtinfo.name = String(courtInfo[2]).trim();
                            objCourtinfo.ordering = String(courtInfo[3]).trim();
                            objCourtinfo.url = Common.GetUrl(objCourtinfo.name?.toLowerCase());
                            objCourtInfoes.push(objCourtinfo);
                            if (!objCourtinfo.name.trim()) {
                                objSuggest.push({
                                    Input: [objCourtinfo.name?.toLowerCase().trim()],
                                    Weight: 12
                                });
                            }
                        }
                    }

                    let objBenchinfoes: GenericInfo[] = [];
                    const benchInfo: string[] = String(dr["bench"]).split('^');
                    if (benchInfo && benchInfo.length > 1) {
                        if (!!benchInfo[0]) {
                            let objBenchinfo: GenericInfo = {} as GenericInfo;
                            objBenchinfo.id = String(benchInfo[0]).trim();
                            objBenchinfo.type = "bench";
                            objBenchinfo.shortName = String(benchInfo[1]).trim();
                            objBenchinfo.name = String(benchInfo[2]).trim();
                            objBenchinfo.ordering = "";
                            objBenchinfo.url = Common.GetUrl(objBenchinfo.name?.toLowerCase());
                            objBenchinfoes.push(objBenchinfo);
                            if (!objBenchinfo.name.trim()) {
                                objSuggest.push({
                                    Input: [objBenchinfo.name?.toLowerCase().trim()],
                                    Weight: 10
                                });
                            }
                        }
                    }

                    let benchTypeInfoes: GenericInfo[] = [];
                    const benchTypeInfo: string[] = String(dr["benchtype"]).split('^');
                    if (benchTypeInfo && benchTypeInfo.length > 1 && benchTypeInfo[0].length > 12) {
                        if (!!benchTypeInfo[0]) {
                            let objBenchTypeinfo: GenericInfo = {} as GenericInfo;
                            objBenchTypeinfo.id = benchTypeInfo[0] !== null ? String(benchTypeInfo[0]).trim() : "";
                            objBenchTypeinfo.type = "benchtype";
                            objBenchTypeinfo.shortName = benchTypeInfo[1] !== null ? String(benchTypeInfo[1]).trim() : "";
                            objBenchTypeinfo.name = benchTypeInfo[2] !== null ? String(benchTypeInfo[2]).trim() : "";
                            objBenchTypeinfo.ordering = "";
                            objBenchTypeinfo.url = Common.GetUrl(objBenchTypeinfo.name?.toLowerCase());
                            benchTypeInfoes.push(objBenchTypeinfo);
                            if (!objBenchTypeinfo.name.trim()) {
                                objSuggest.push({
                                    Input: [objBenchTypeinfo.name?.toLowerCase().trim()],
                                    Weight: 1
                                });
                            }
                        }
                    }

                    let objInfavinfoes: GenericInfo[] = [];
                    const infavInfoes: string[] | null = (dr["InfavourofText"]) ? String(dr["InfavourofText"]).split('|') : null;
                    if (infavInfoes) {
                        for (const infavof of infavInfoes) {
                            let objInfavOf: GenericInfo = {} as GenericInfo;
                            objInfavOf.id = infavof.split('^')[0];
                            objInfavOf.name = infavof.split('^')[1];
                            objInfavOf.shortName = "";
                            objInfavOf.type = "infavourof";
                            objInfavinfoes.push(objInfavOf);
                            if (!objInfavOf.name.trim()) {
                                objSuggest.push({
                                    Input: [objInfavOf.name?.toLowerCase().trim()],
                                    Weight: 1
                                });
                            }
                        }
                    }

                    let objServices: GenericInfo[] = [];
                    const serviceinfo: string[] = String(dr["ServiceInfo"])?.replace("$|", " ").split('|');
                    if (serviceinfo && serviceinfo.length > 1) {
                        if (!!serviceinfo[0]) {
                            let objserviceinfo: GenericInfo = {} as GenericInfo;
                            objserviceinfo.id = String(serviceinfo[0]).trim();
                            objserviceinfo.type = "service";
                            objserviceinfo.shortName = String(serviceinfo[2]).trim();
                            objserviceinfo.name = String(serviceinfo[2]).trim();
                            objserviceinfo.ordering = objserviceinfo.name?.toLowerCase();
                            objserviceinfo.orderInteger = parseInt(serviceinfo[3]);
                            objserviceinfo.url = Common.GetUrl(objserviceinfo.name?.toLowerCase());
                            objServices.push(objserviceinfo);
                            //if (!objserviceinfo.name.trim()) {
                            //  objSuggest.push(objserviceinfo.name?.toLowerCase().trim());
                            //}
                        }
                    }

                    const asindases: string[] | null = (dr["AAAAssociation"]) ? String(dr["AAAAssociation"]).split('$') : null;
                    if (asindases) {
                        let objasinfoes: GenericInfo[] = [];
                        let objindasinfoes: GenericInfo[] = [];
                        for (const asindas of asindases) {
                            if (!!asindas) {
                                const asindasinfo: string[] = asindas.split('^');
                                const type: string = asindasinfo[0].split('|')[1].trim();
                                if (type !== "" && type?.toLowerCase() === "account standard") {
                                    if (!!asindasinfo[0].split('|')[0]) {
                                        let objasinfo: GenericInfo = {} as GenericInfo;
                                        objasinfo.id = asindasinfo[0].split('|')[0].trim();
                                        objasinfo.type = "accountingstandard";
                                        objasinfo.name = asindasinfo[1].split('#')[0].trim();
                                        objasinfo.shortName = objasinfo.name.split(':')[0].trim();
                                        objasinfo.ordering = objasinfo.shortName?.toLowerCase();
                                        objasinfo.orderInteger = parseInt(asindasinfo[1].split('#')[1].split('~')[0].trim(), 10);
                                        objasinfo.year = asindasinfo[1].split('#')[1].split('~')[1].trim();
                                        objasinfo.url = Common.GetUrl(objasinfo.shortName?.toLowerCase());
                                        objasinfoes.push(objasinfo);
                                        //if (!objasinfo.name.trim()) {
                                        //  objSuggest.push(objasinfo.name.trim());
                                        //}
                                    }
                                } else if (type !== "" && type?.toLowerCase() === "ind as") {
                                    if (!!asindasinfo[0].split('|')[0]) {
                                        let objindasinfo: GenericInfo = {} as GenericInfo;
                                        objindasinfo.id = asindasinfo[0].split('|')[0].trim();
                                        objindasinfo.type = "indas";
                                        objindasinfo.name = asindasinfo[1].split('#')[0].trim();
                                        objindasinfo.shortName = objindasinfo.name.split(':')[0].trim();
                                        objindasinfo.ordering = objindasinfo.shortName?.toLowerCase();
                                        objindasinfo.orderInteger = parseInt(asindasinfo[1].split('#')[1].split('~')[0].trim(), 10);
                                        objindasinfo.year = asindasinfo[1].split('#')[1].split('~')[1].trim();
                                        objindasinfo.url = Common.GetUrl(objindasinfo.shortName?.toLowerCase());
                                        objindasinfoes.push(objindasinfo);
                                        //if (!objindasinfo.name.trim()) {
                                        //  objSuggest.push(objindasinfo.name.trim());
                                        //}
                                    }
                                }
                            }
                        }
                        objMasterInfo.accountingstandard = objasinfoes;
                        objMasterInfo.indas = objindasinfoes;
                    }

                    //#endregion

                    //#region citation

                    const objCitations: Citation[] = [];
                    const searchCitation: FormattedCitation[] = [];

                    const citationString: string = dr["citation"]?.toString();
                    if (citationString.includes('$')) {
                        const citationInfoes: string[] | null = citationString.split('$');
                        if (citationInfoes) {
                            for (const citationInfo of citationInfoes) {
                                const objFormattedCitation: FormattedCitation = {};
                                const objYear: citationinfo = {} as citationinfo;
                                const objJournal: citationinfo = {} as citationinfo;
                                const objVolume: citationinfo = {} as citationinfo;
                                const objPage: citationinfo = {} as citationinfo;

                                const yearJournalVolumePage: string[] | null = citationInfo.split('|');
                                if (yearJournalVolumePage[0]) {
                                    objYear.id = yearJournalVolumePage[0];
                                    objYear.name = yearJournalVolumePage[0];
                                    objYear.shortName = yearJournalVolumePage[0];
                                    objYear.ordering = yearJournalVolumePage[0];
                                    objYear.type = "year";
                                    objYear.url = Common.GetUrl(objYear.name);
                                }

                                if (yearJournalVolumePage[1]) {
                                    const idName: string[] = yearJournalVolumePage[1].split('^');
                                    objJournal.id = idName[0];
                                    objJournal.name = idName[1];
                                    objJournal.shortName = idName[1];
                                    objJournal.ordering = idName[1]?.toLowerCase();
                                    objJournal.type = "journal";
                                    objJournal.url = Common.GetUrl(objJournal.name);
                                }

                                if (yearJournalVolumePage[2]) {
                                    objVolume.id = yearJournalVolumePage[2];
                                    objVolume.name = yearJournalVolumePage[2].trim() ? parseInt(yearJournalVolumePage[2].trim(), 10)?.toString().padStart(4, '0') : Common.getRepeat("?", 4);
                                    objVolume.shortName = yearJournalVolumePage[2];
                                    objVolume.ordering = yearJournalVolumePage[2];
                                    objVolume.type = "volume";
                                    objVolume.url = Common.GetUrl(objVolume.name);
                                }

                                if (yearJournalVolumePage[3]) {
                                    objPage.id = yearJournalVolumePage[3];
                                    objPage.name = yearJournalVolumePage[3].trim() ? yearJournalVolumePage[3].trim().padStart(7, '0') : Common.getRepeat("?", 7);
                                    objPage.shortName = yearJournalVolumePage[3];
                                    objPage.ordering = yearJournalVolumePage[3];
                                    objPage.type = "page";
                                    objPage.url = Common.GetUrl(objPage.name);
                                }

                                searchCitation.push({ name: objYear.name + objJournal.id + objVolume.name + objPage.name });

                                objCitations.push({ year: objYear, journal: objJournal, volume: objVolume, pageno: objPage });
                            }
                        }
                    } else {
                        const objCitation: Citation = {} as Citation;
                        const objYear: citationinfo = {} as citationinfo;
                        const objJournal: citationinfo = {} as citationinfo;
                        const objVolume: citationinfo = {} as citationinfo;
                        const objPage: citationinfo = {} as citationinfo;
                        const objFormattedCitation: FormattedCitation = {};

                        const yearJournalVolumePage: string[] | null = citationString.split('|');
                        if (yearJournalVolumePage) {
                            if (yearJournalVolumePage[0]) {
                                objYear.id = yearJournalVolumePage[0];
                                objYear.name = yearJournalVolumePage[0];
                                objYear.shortName = yearJournalVolumePage[0];
                                objYear.ordering = yearJournalVolumePage[0];
                                objYear.type = "year";
                                objYear.url = Common.GetUrl(objYear.name);
                            }

                            if (yearJournalVolumePage[1]) {
                                const idName: string[] = yearJournalVolumePage[1].split('^');
                                objJournal.id = idName[0];
                                objJournal.name = idName[1];
                                objJournal.shortName = idName[1];
                                objJournal.ordering = idName[1]?.toLowerCase();
                                objJournal.type = "journal";
                                objJournal.url = Common.GetUrl(objJournal.name);
                            }

                            if (yearJournalVolumePage[2]) {
                                objVolume.id = yearJournalVolumePage[2];
                                objVolume.name = yearJournalVolumePage[2].trim() ? parseInt(yearJournalVolumePage[2].trim(), 10)?.toString().padStart(4, '0') : Common.getRepeat("?", 4);
                                objVolume.shortName = yearJournalVolumePage[2];
                                objVolume.ordering = yearJournalVolumePage[2];
                                objVolume.type = "volume";
                                objVolume.url = Common.GetUrl(objVolume.name);
                            }

                            if (yearJournalVolumePage[3]) {
                                objPage.id = yearJournalVolumePage[3];
                                objPage.name = yearJournalVolumePage[3].trim() ? yearJournalVolumePage[3].trim().padStart(7, '0') : Common.getRepeat("?", 7);
                                objPage.shortName = yearJournalVolumePage[3];
                                objPage.ordering = yearJournalVolumePage[3];
                                objPage.type = "page";
                                objPage.url = Common.GetUrl(objPage.name);
                            }

                            searchCitation.push({ name: objYear.name + objJournal.id + objVolume.name + objPage.name });

                            objCitations.push({ year: objYear, journal: objJournal, volume: objVolume, pageno: objPage });
                        }
                    }

                    objMasters.citations = objCitations;
                    indexDocument.masterinfo = objMasters;

                    if (searchCitation.length > 0) {
                        const item = searchCitation[searchCitation.length - 1]?.name;
                        if (!!item) indexDocument.sortheadingnumber = item?.toString();
                    }

                    const objSearchCit: SearchCitation = { formattedcitation: searchCitation } as SearchCitation;
                    indexDocument.searchcitation = objSearchCit;


                    //#endregion

                    //#region OtherInfo Addition

                    const objOtherInfos: Otherinfo = {} as Otherinfo;
                    const objFullCitations: otherinfo[] = [];
                    const objSimilarFullCitations: otherinfo[] = [];
                    const objJudges: otherinfo[] = [];
                    const objCounsels: otherinfo[] = [];
                    const objAppealNos: otherinfo[] = [];
                    const objAsstYrs: otherinfo[] = [];
                    const objParties: otherinfo[] = [];

                    if (!!dr["fullcitation"]?.toString()) {
                        let fullcitation: string = dr["fullcitation"]?.toString().trimEnd('|')?.replace('|', '/');
                        const objFullCitation: otherinfo = {} as otherinfo;
                        objFullCitation.id = "";
                        objFullCitation.name = fullcitation + " [" + dr["documentdate"]?.toString().split('^')[1] + "]";
                        objFullCitation.shortName = "";
                        objFullCitation.type = "fullcitation";

                        if (!!objFullCitation.name && objFullCitation.name[0] === '/')
                            objFullCitation.name = objFullCitation.name.substring(1);
                        objFullCitations.push(objFullCitation);
                    }
                    //#endregion

                    //#region iltinfo
                    //#region citation

                    let objIltInfoes: Iltinfo[] = [];
                    let searchIltCitation: FormattedCitation[] = [];
                    let countries: string[] = [];
                    let articles: string[] = [];

                    if (dr["iltassociation"]?.toString().indexOf('$') != -1) {
                        let citationInfoes: string[] | null = dr["iltassociation"] ? dr["iltassociation"]?.toString().split('$') : null;
                        if (citationInfoes) {
                            for (let citationInfo of citationInfoes) {
                                let objFormattedCitation: FormattedCitation = { name: "" };
                                let objCountry1: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                                let objCountry2: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                                let objArticle: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                                let objSubject: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                                let objSubSubject: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                                let cnty1cnty2artsub: string[] | null = citationInfo ? citationInfo.split('|') : null;

                                if (cnty1cnty2artsub && cnty1cnty2artsub[0]) {
                                    objCountry1.id = cnty1cnty2artsub[0].split('^')[0];
                                    objCountry1.name = cnty1cnty2artsub[0].split('^')[1].indexOf("#") != -1 ? cnty1cnty2artsub[0].split('^')[1].split('#')[0] : cnty1cnty2artsub[0].split('^')[1];
                                    objCountry1.shortName = "";
                                    objCountry1.ordering = cnty1cnty2artsub[0].split('^')[1].indexOf("#") != -1 ? cnty1cnty2artsub[0].split('^')[1].split('#')[1] : cnty1cnty2artsub[0].split('^')[1];
                                    objCountry1.orderInteger = cnty1cnty2artsub[0].split('^')[1].indexOf("#") != -1 ? Number(cnty1cnty2artsub[0].split('^')[1].split('#')[1]) : 0;
                                    objCountry1.type = "country1";
                                    objCountry1.url = Common.GetUrl(objCountry1.name);
                                    if (objCountry1.name.trim() !== "")
                                        countries.push(objCountry1.name?.toLowerCase().trim());
                                }
                                if (cnty1cnty2artsub && cnty1cnty2artsub[1]) {
                                    if (cnty1cnty2artsub[1].length > 5) {
                                        objCountry2.id = cnty1cnty2artsub[1].split('^')[0];
                                        objCountry2.pid = objCountry1.id;
                                        objCountry2.name = cnty1cnty2artsub[1].split('^')[1].indexOf("#") != -1 ? cnty1cnty2artsub[1].split('^')[1].split('#')[0] : cnty1cnty2artsub[1].split('^')[1];
                                        objCountry2.shortName = "";
                                        objCountry2.ordering = cnty1cnty2artsub[1].split('^')[1].indexOf("#") != -1 ? cnty1cnty2artsub[1].split('^')[1].split('#')[1] : cnty1cnty2artsub[1].split('^')[1];
                                        objCountry2.orderInteger = cnty1cnty2artsub[1].split('^')[1].indexOf("#") != -1 ? Number(cnty1cnty2artsub[1].split('^')[1].split('#')[1]) : 0;
                                        objCountry2.type = "country2";
                                        objCountry2.url = Common.GetUrl(objCountry2.name);
                                    } else {
                                        objCountry2.id = "";
                                        objCountry2.pid = "";
                                        objCountry2.name = "";
                                        objCountry2.shortName = "";
                                        objCountry2.ordering = "";
                                        objCountry2.orderInteger = 0;
                                        objCountry2.type = "country2";
                                        objCountry2.url = Common.GetUrl(objCountry2.name);
                                    }
                                    if (objCountry2.name.trim() !== "")
                                        countries.push(objCountry2.name?.toLowerCase().trim());
                                }
                                if (cnty1cnty2artsub && cnty1cnty2artsub[2]) {
                                    if (cnty1cnty2artsub[2].length > 5) {
                                        objArticle.id = cnty1cnty2artsub[2].split('^')[0];
                                        objArticle.name = cnty1cnty2artsub[2].indexOf("#") != -1 ? cnty1cnty2artsub[2].split('^')[1].split('#')[0] : cnty1cnty2artsub[2].split('^')[1];
                                        if (!!objCountry1.id) objArticle.pid = objCountry1.id + objCountry2.id;
                                        objArticle.shortName = "";
                                        objArticle.ordering = cnty1cnty2artsub[2].indexOf("#") != -1 ? cnty1cnty2artsub[2].split('^')[1].split('#')[1] : "";
                                        objArticle.type = "article";
                                        objArticle.url = Common.GetUrl(objArticle.name);
                                    } else {
                                        objArticle.id = "";
                                        objArticle.name = "";
                                        objArticle.shortName = "";
                                        objArticle.ordering = "";
                                        objArticle.type = "article";
                                        objArticle.url = "";
                                    }
                                    if (objArticle.name.trim() !== "")
                                        articles.push(objArticle.name?.toLowerCase().trim());
                                }
                                if (cnty1cnty2artsub && cnty1cnty2artsub[3]) {
                                    if (cnty1cnty2artsub[3].length > 5) {
                                        objSubject.id = cnty1cnty2artsub[3].split('^')[0].indexOf('-') != -1 ? cnty1cnty2artsub[3].split('^')[0].split('-')[0] : cnty1cnty2artsub[3].split('^')[0];
                                        if (!!objCountry1.id) objSubject.pid = objCountry1.id + objCountry2.id;
                                        objSubject.pSubId = cnty1cnty2artsub[3].split('^')[0].indexOf('-') != -1 ? cnty1cnty2artsub[3].split('^')[0].split('-')[1] : "";
                                        objSubject.name = cnty1cnty2artsub[3].split('^')[1];
                                        objSubject.shortName = "";
                                        objSubject.ordering = cnty1cnty2artsub[3].split('^')[1]?.toLowerCase();
                                        objSubject.type = "subject";
                                        objSubject.url = Common.GetUrl(objSubject.name);
                                    } else {
                                        objSubject.id = "";
                                        objSubject.name = "";
                                        objSubject.shortName = "";
                                        objSubject.ordering = "";
                                        objSubject.type = "subject";
                                        objSubject.url = "";
                                    }
                                    if (objSubject.name.trim() !== "")
                                        subjectArray.push(objSubject.name?.toLowerCase().trim());
                                }
                                if (cnty1cnty2artsub && cnty1cnty2artsub[4]) {
                                    if (cnty1cnty2artsub[4].length > 5) {
                                        objSubSubject.id = cnty1cnty2artsub[4].split('^')[0];
                                        objSubSubject.pid = objSubject.id;
                                        objSubSubject.name = cnty1cnty2artsub[4].split('^')[1];
                                        objSubSubject.shortName = "";
                                        objSubSubject.ordering = cnty1cnty2artsub[4].split('^')[1]?.toLowerCase();
                                        objSubSubject.type = "subsubject";
                                        objSubSubject.url = Common.GetUrl(objSubSubject.name);
                                    }
                                    if (objSubSubject && objSubSubject.name && objSubSubject.name.trim() !== "")
                                        subjectArray.push(objSubSubject.name?.toLowerCase().trim());
                                }
                                if (objCountry1.id) searchIltCitation.push({ name: objCountry1.id + objCountry2.id + objArticle.id + objSubject.id + objSubSubject.id });

                                objIltInfoes.push({
                                    country1: objCountry1,
                                    country2: objCountry2,
                                    article: objArticle,
                                    subject: objSubject,
                                    subsubject: objSubSubject,
                                });
                            }
                        }
                    } else {
                        let objFormattedCitation: FormattedCitation = { name: "" };
                        let objCountry1: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                        let objCountry2: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                        let objArticle: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                        let objSubject: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                        let objSubSubject: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                        let cnty1cnty2artsub: string[] | null = dr["iltassociation"] ? dr["iltassociation"]?.toString().split('|') : null;

                        if (cnty1cnty2artsub && cnty1cnty2artsub[0]) {
                            objCountry1.id = cnty1cnty2artsub[0].split('^')[0];
                            objCountry1.name = cnty1cnty2artsub[0].split('^')[1].indexOf("#") != -1 ? cnty1cnty2artsub[0].split('^')[1].split('#')[0] : cnty1cnty2artsub[0].split('^')[1];
                            objCountry1.shortName = "";
                            objCountry1.ordering = cnty1cnty2artsub[0].split('^')[1].indexOf("#") != -1 ? cnty1cnty2artsub[0].split('^')[1].split('#')[1] : cnty1cnty2artsub[0].split('^')[1];
                            objCountry1.orderInteger = cnty1cnty2artsub[0].split('^')[1].indexOf("#") != -1 ? Number(cnty1cnty2artsub[0].split('^')[1].split('#')[1]) : 0;
                            objCountry1.type = "country1";
                            objCountry1.url = Common.GetUrl(objCountry1.name);
                            if (objCountry1.name.trim() !== "")
                                countries.push(objCountry1.name?.toLowerCase().trim());
                        }
                        if (cnty1cnty2artsub && cnty1cnty2artsub[1]) {
                            if (cnty1cnty2artsub[1].length > 5) {
                                objCountry2.id = cnty1cnty2artsub[1].split('^')[0];
                                objCountry2.pid = objCountry1.id;
                                objCountry2.name = cnty1cnty2artsub[1].split('^')[1].indexOf("#") != -1 ? cnty1cnty2artsub[1].split('^')[1].split('#')[0] : cnty1cnty2artsub[1].split('^')[1];
                                objCountry2.shortName = "";
                                objCountry2.ordering = cnty1cnty2artsub[1].split('^')[1].indexOf("#") != -1 ? cnty1cnty2artsub[1].split('^')[1].split('#')[1] : cnty1cnty2artsub[1].split('^')[1];
                                objCountry2.orderInteger = cnty1cnty2artsub[1].split('^')[1].indexOf("#") != -1 ? Number(cnty1cnty2artsub[1].split('^')[1].split('#')[1]) : 0;
                                objCountry2.type = "country2";
                                objCountry2.url = Common.GetUrl(objCountry2.name);
                            } else {
                                objCountry2.id = "";
                                objCountry2.pid = "";
                                objCountry2.name = "";
                                objCountry2.shortName = "";
                                objCountry2.ordering = "";
                                objCountry2.orderInteger = 0;
                                objCountry2.type = "country2";
                                objCountry2.url = Common.GetUrl(objCountry2.name);
                            }
                            if (objCountry2.name.trim() !== "")
                                countries.push(objCountry2.name?.toLowerCase().trim());
                        }
                        if (cnty1cnty2artsub && cnty1cnty2artsub[2]) {
                            if (cnty1cnty2artsub[2].length > 5) {
                                objArticle.id = cnty1cnty2artsub[2].split('^')[0];
                                objArticle.name = cnty1cnty2artsub[2].indexOf("#") != -1 ? cnty1cnty2artsub[2].split('^')[1].split('#')[0] : cnty1cnty2artsub[2].split('^')[1];
                                if (objCountry1.id) objArticle.pid = objCountry1.id + objCountry2.id;
                                objArticle.shortName = "";
                                objArticle.ordering = cnty1cnty2artsub[2].indexOf("#") != -1 ? cnty1cnty2artsub[2].split('^')[1].split('#')[1] : "";
                                objArticle.type = "article";
                                objArticle.url = Common.GetUrl(objArticle.name);
                            } else {
                                objArticle.id = "";
                                objArticle.name = "";
                                objArticle.shortName = "";
                                objArticle.ordering = "";
                                objArticle.type = "article";
                                objArticle.url = "";
                            }
                            if (objArticle.name.trim() !== "")
                                articles.push(objArticle.name?.toLowerCase().trim());
                        }
                        if (cnty1cnty2artsub && cnty1cnty2artsub[3]) {
                            if (cnty1cnty2artsub[3].length > 5) {
                                objSubject.id = cnty1cnty2artsub[3].split('^')[0].indexOf('-') != -1 ? cnty1cnty2artsub[3].split('^')[0].split('-')[0] : cnty1cnty2artsub[3].split('^')[0];
                                objSubject.name = cnty1cnty2artsub[3].split('^')[1];
                                objSubject.pSubId = cnty1cnty2artsub[3].split('^')[0].indexOf('-') != -1 ? cnty1cnty2artsub[3].split('^')[0].split('-')[1] : "";
                                objSubject.shortName = "";
                                objSubject.ordering = cnty1cnty2artsub[3].split('^')[1]?.toLowerCase();
                                objSubject.type = "subject";
                                objSubject.url = Common.GetUrl(objSubject.name);
                            } else {
                                objSubject.id = "";
                                objSubject.name = "";
                                objSubject.shortName = "";
                                objSubject.ordering = "";
                                objSubject.type = "subject";
                                objSubject.url = "";
                            }
                            if (objSubject.name.trim() !== "")
                                subjectArray.push(objSubject.name?.toLowerCase().trim());
                        }
                        if (cnty1cnty2artsub && cnty1cnty2artsub[4]) {
                            if (cnty1cnty2artsub[4].length > 5) {
                                objSubSubject.id = cnty1cnty2artsub[4].split('^')[0];
                                objSubSubject.pid = objSubject.id;
                                objSubSubject.name = cnty1cnty2artsub[4].split('^')[1];
                                objSubSubject.shortName = "";
                                objSubSubject.ordering = cnty1cnty2artsub[4].split('^')[1]?.toLowerCase();
                                objSubSubject.type = "subsubject";
                                objSubSubject.url = Common.GetUrl(objSubSubject.name);
                            }
                            if (objSubSubject.name && objSubSubject.name.trim() !== "")
                                subjectArray.push(objSubSubject.name?.toLowerCase().trim());
                        }
                        if (!!objCountry1.id) searchIltCitation.push({ name: objCountry1.id + objCountry2.id + objArticle.id + objSubject.id + objSubSubject.id });

                        objIltInfoes.push({
                            country1: objCountry1,
                            country2: objCountry2,
                            article: objArticle,
                            subject: objSubject,
                            subsubject: objSubSubject,
                        });
                    }

                    if (countries.length > 0) {
                        objSuggest.push({
                            Input: countries,
                            Weight: 8,
                        });
                    }
                    if (articles.length > 0) {
                        objSuggest.push({
                            Input: articles,
                            Weight: 1,
                        });
                    }
                    if (subjectArray.length > 0) {
                        objSuggest.push({
                            Input: subjectArray,
                            Weight: 16,
                        });
                    }

                    indexDocument.masterinfo = objMasters;

                    let objSearchIltCit: SearchIltCitation = { formattediltcitation: searchIltCitation } as SearchIltCitation;
                    indexDocument.searchiltcitation = objSearchIltCit;
                    //#endregion
                    objMasters.iltinfoes = objIltInfoes;


                    //#endregion
                    indexDocument.masterinfo = objMasters;

                    //#region tag info

                    let taginfoArray = !!dr["TagInfo"]
                        ? String(dr["TagInfo"]).split('$')
                        : null;

                    if (taginfoArray !== null) {
                        const objTagInfoes: Taginfo[] = [];
                        for (const taginfo of taginfoArray) {
                            const tags = taginfo.split('|');

                            for (const tag of tags) {
                                if (tag && tag.indexOf("0^0") === -1) {
                                    const tagInfo: Taginfo = {
                                        id: tag.split('^')[0],
                                        name: tag.split('^')[1],
                                    };
                                    objTagInfoes.push(tagInfo);
                                }
                            }
                        }
                        indexDocument.taginfo = objTagInfoes;
                    } else {
                        indexDocument.taginfo = [{ id: "", name: "" }];
                    }

                    //#endregion

                    //#region marking info

                    const markinginfoArray = !!dr["MarkingInfo"]
                        ? String(dr["MarkingInfo"]).split('$')
                        : null;

                    let topStoryHeading = '';
                    let topStoryDesc = '';

                    if (markinginfoArray !== null) {
                        const objMarkingInfoes: Markinginfo[] = [];
                        let num: number = 0;

                        for (const markinginfo of markinginfoArray) {
                            num++;
                            const markings = markinginfo.split('|');

                            if (markings !== null && markings.length > 1) {
                                const marking1 = markings[1]?.replace("&#39;", "'");
                                const markingInfo: Markinginfo = {
                                    number: num,
                                    text: markings[0],
                                    image: marking1.split('^')[0],
                                };

                                if (num === 1) {
                                    topStoryHeading = marking1.split('^')[1].split(new RegExp("##", "g"))[0];
                                    topStoryDesc = marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[0];
                                }

                                const pmark = marking1.indexOf("@@e") !== -1 ? marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[1].split('~')[1].split('\\')[1]?.replace('_', ' ').trim().split(new RegExp("@@e", "g"))[1] : "";
                                const parentmark = marking1.indexOf("@@t") !== -1 ? pmark.split(new RegExp("@@t", "g")) : null;

                                markingInfo.entrydate = marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[1].split('~')[1].split('\\')[0];
                                markingInfo.updateddate = marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[1].split('~')[1].split('\\')[1]?.replace('_', ' ').trim().split(new RegExp("@@e", "g"))[0];

                                if (parentmark !== null) {
                                    markingInfo.parentmarking = (parentmark[0] + ", " + parentmark[1]).trim()?.replace(/^,/, '')?.toLowerCase();
                                }

                                objMarkingInfoes.push(markingInfo);
                            }
                        }

                        indexDocument.markinginfo = objMarkingInfoes;
                    } else {
                        indexDocument.markinginfo = [{ number: 0, text: "", image: "", entrydate: new Date().toLocaleDateString(), updateddate: new Date().toLocaleDateString() }];
                    }

                    indexDocument.topstoryheading = topStoryHeading;
                    indexDocument.topstorydesc = topStoryDesc;

                    //#endregion

                    //#region headnotes

                    const lstHeadNotes: Headnote[] = [];
                    let headnotesttext = '';

                    if (!!dr["hn1"]?.toString()) {
                        lstHeadNotes.push({ number: 1, text: dr["hn1"]?.toString() });
                        headnotesttext += dr["hn1"]?.toString() + "~~";
                    }
                    if (!!dr["hn2"]?.toString()) {
                        lstHeadNotes.push({ number: 2, text: dr["hn2"]?.toString() });
                        headnotesttext += dr["hn2"]?.toString() + "~~";
                    }
                    if (!!dr["hn3"]?.toString()) {
                        lstHeadNotes.push({ number: 3, text: dr["hn3"]?.toString() });
                        headnotesttext += dr["hn3"]?.toString() + "~~";
                    }
                    if (!!dr["hn4"]?.toString()) {
                        lstHeadNotes.push({ number: 4, text: dr["hn4"]?.toString() });
                        headnotesttext += dr["hn4"]?.toString() + "~~";
                    }
                    if (!!dr["hn5"]?.toString()) {
                        lstHeadNotes.push({ number: 5, text: dr["hn5"]?.toString() });
                        headnotesttext += dr["hn5"]?.toString() + "~~";
                    }
                    if (!!dr["hn6"]?.toString()) {
                        lstHeadNotes.push({ number: 6, text: dr["hn6"]?.toString() });
                        headnotesttext += dr["hn6"]?.toString() + "~~";
                    }
                    if (!!dr["hn7"]?.toString()) {
                        lstHeadNotes.push({ number: 7, text: dr["hn7"]?.toString() });
                        headnotesttext += dr["hn7"]?.toString() + "~~";
                    }
                    if (!!dr["hn8"]?.toString()) {
                        lstHeadNotes.push({ number: 8, text: dr["hn8"]?.toString() });
                        headnotesttext += dr["hn8"]?.toString() + "~~";
                    }
                    if (!!dr["hn9"]?.toString()) {
                        lstHeadNotes.push({ number: 9, text: dr["hn9"]?.toString() });
                        headnotesttext += dr["hn9"]?.toString() + "~~";
                    }
                    if (!!dr["hn10"]?.toString()) {
                        lstHeadNotes.push({ number: 10, text: dr["hn10"]?.toString() });
                        headnotesttext += dr["hn10"]?.toString() + " ";
                    }

                    indexDocument.headnotes = lstHeadNotes;

                    //#endregion
                    console.log('----14');

                    if (dr["court"]?.toString().indexOf("111270000000000009") !== -1) // 111270000000000009^Supreme Court of India^SC
                        indexDocument.documenttypeboost = 5000;
                    else if (dr["court"]?.toString().indexOf("111270000000000044") !== -1) // 111270000000000044^High Court^HC
                        indexDocument.documenttypeboost = 4500;
                    else if (dr["court"]?.toString().indexOf("111270000000000002") !== -1) // 111270000000000002^Authority for Advance Ruling^AAR
                        indexDocument.documenttypeboost = 4000;
                    else if (dr["court"]?.toString().indexOf("111270000000000007") !== -1) // 111270000000000007^Income Tax Appellate Tribunal^ITAT
                        indexDocument.documenttypeboost = 3500;
                    else
                        indexDocument.documenttypeboost = 3200;
                    // console.log('----15');
                    const headings: string[] = [];
                    if (!!dr["HeadingSubheading"]?.toString()) {
                        const headingSubheadings = dr["HeadingSubheading"]?.toString().split('$');
                        for (const headsubhead of headingSubheadings) {
                            if (headsubhead.indexOf('|') !== -1) {
                                if (headsubhead.split('|')[0] !== "")
                                    headings.push(headsubhead.split('|')[0]?.toLowerCase().trim());
                                if (headsubhead.split('|')[1] !== "")
                                    headings.push(headsubhead.split('|')[1]?.toLowerCase().trim());
                            }
                        }
                    }

                    if (headings.length > 0) {
                        objSuggest.push({
                            Input: headings,
                            Weight: 16
                        });
                    }
                    console.log('----1ef5');
                    indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(
                        dr["categoriescentax"]?.toString()?.toLowerCase() + " " +
                        dr["groups"]?.toString()?.toLowerCase() + " " +
                        dr["fullcitation"]?.toString()?.toLowerCase() + " " +
                        dr["partyname1"]?.toString()?.toLowerCase() + " " +
                        dr["partyname2"]?.toString()?.toLowerCase() + " appeal no " +
                        dr["appealno"]?.toString()?.toLowerCase() + " " +
                        Common.StringOnly(dr["counselnameappellant"]?.toString())?.toLowerCase() + " " +
                        Common.StringOnly(dr["counselnamerespondent"]?.toString())?.toLowerCase() + " " +
                        Common.StringOnly(dr["judgename"]?.toString())?.toLowerCase() + " " +
                        dr["documentdate"]?.toString()?.toLowerCase() + " " +
                        Common.StringOnly(dr["court"]?.toString())?.toLowerCase() + " " +
                        Common.StringOnly(dr["bench"]?.toString())?.toLowerCase() + " " +
                        Common.StringOnly(dr["benchtype"]?.toString())?.toLowerCase() + " " +
                        Common.StringOnly(dr["InfavourofText"]?.toString())?.toLowerCase() + " " +
                        Common.StringOnly(dr["actassociations"]?.toString())?.toLowerCase() + " " +
                        dr["Heading"]?.toString().trim() + " " +
                        dr["subheading"]?.toString().trim()
                    );
                    indexDocument.headnotestext = headnotesttext + " " + indexDocument.searchboosttext;
                    indexDocument.shortcontent = dr["shortcontent"]?.toString().trim();
                    console.log('----1544');
                    //#region footnote region
                    let fullContent: string = "";
                    const footnotecontent: string[] = [];

                    // const doc = new DOMParser().parseFromString(String(dr["fullcontent"]), "text/html");
                    const htmlString = String(dr["fullcontent"]);
                    const dom = new JSDOM(htmlString);
                    const doc = dom.window.document;

                    const isHtmlFootnote: boolean = !!doc.querySelector("div.footprint");

                    if (isHtmlFootnote && indexDocument.documentformat === ".htm") {
                        const footprints = doc.querySelectorAll("div.footprint");
                        footprints.forEach((item: any) => {
                            item.remove();
                            footnotecontent.push(item.outerHTML);
                        });
                        fullContent = doc.documentElement.innerHTML;
                    } else if (String(dr["fullcontent"]).indexOf("<footnote>") !== -1) {
                        const regexfootnote = /<footnote>(.*?)<\/footnote>/g;
                        const matchesfootnote = String(dr["fullcontent"]).match(regexfootnote) || [];

                        matchesfootnote.forEach((matchfoot) => {
                            footnotecontent.push(matchfoot);
                        });

                        fullContent = String(dr["fullcontent"])?.replace(regexfootnote, "");
                    } else {
                        fullContent = String(dr["fullcontent"]);
                    }

                    indexDocument.footnotecontent = footnotecontent.join("");

                    //#endregion

                    console.log('----1266');
                    //#region remove header tag from full content
                    if (String(dr["fullcontent"]).indexOf("<header>") !== -1) {
                        fullContent = Common.RemovedHeaderTag(fullContent);
                    }
                    //#endregion
                    //#region xml meta tag
                    if (String(dr["fullcontent"]).indexOf("<header>") !== -1) {
                        indexDocument.xmltag = Common.GetMetaTag(String(dr["fullcontent"]));
                    } else {
                        indexDocument.xmltag = "";
                    }
                    //#endregion
                    console.log('----15');
                    //#region wordPhraseIds
                    const wordPhraseIds: string[] = dr["CrossTagging"]
                        ?.toString()
                        .split(" ")
                        .filter((x: any) => !!x.trim());
                    indexDocument.wordphraseids = wordPhraseIds;
                    //#endregion
                    indexDocument.fullcontent = fullContent.trim().lastIndexOf("</document>") !== -1
                        ? fullContent.trim()?.replace(
                            "</document>",
                            "<div id='xmlmetadata' style='display:none;'>" +
                            indexDocument.searchboosttext +
                            "</div></document>"
                        )
                        : fullContent.lastIndexOf("</html>") !== -1
                            ? fullContent.trim()?.replace(
                                "</html>",
                                "<div id='htmmetadata' style='display:none;'>" +
                                indexDocument.searchboosttext +
                                "</div></html>"
                            )
                            : fullContent.trim() +
                            "<div id='nodata' style='display:none;'>" +
                            indexDocument.searchboosttext +
                            "</div>";

                    indexDocument.Suggest = objSuggest;
                    indexDocument.created_date = new Date(
                        !!dr["created_date"]
                            ? dr["created_date"]
                                ?.toString()
                                .substring(0, 4) +
                            "-" +
                            dr["created_date"]?.toString().substring(4, 2) +
                            "-" +
                            dr["created_date"]?.toString().substring(6, 2) +
                            " " +
                            dr["created_date"]?.toString().substring(8, 2) +
                            ":" +
                            dr["created_date"]?.toString().substring(10, 2) +
                            ":" +
                            dr["created_date"]?.toString().substring(12, 2)
                            : "1900-01-01"
                    );
                    const formatteddate =
                        !!indexDocument.documentdate
                            ? indexDocument.documentdate.substring(0, 4) +
                            "-" +
                            indexDocument.documentdate.substring(4, 2) +
                            "-" +
                            indexDocument.documentdate.substring(6, 2)
                            : "1900-01-01";
                    indexDocument.updated_date = new Date(
                        !!dr["UpdatedDate"]
                            ? dr["UpdatedDate"]
                                ?.toString()
                                .substring(0, 4) +
                            "-" +
                            dr["UpdatedDate"]?.toString().substring(4, 2) +
                            "-" +
                            dr["UpdatedDate"]?.toString().substring(6, 2) +
                            " " +
                            dr["UpdatedDate"]?.toString().substring(8, 2) +
                            ":" +
                            dr["UpdatedDate"]?.toString().substring(10, 2) +
                            ":" +
                            dr["UpdatedDate"]?.toString().substring(12, 2)
                            : "1900-01-01"
                    );

                    indexDocument.ispublished = true;
                    indexDocument.lastpublished_date = new Date(new Date().toISOString().slice(0, 10));
                    indexDocument.lastQCDate = new Date(new Date().toISOString().slice(0, 10));
                    indexDocument.isshowonsite = true;
                    indexDocument.boostpopularity = 1000;

                    if (!!indexDocument && !!indexDocument.categories) {
                        const filteredCategory: Category[] = indexDocument.categories.filter(
                            (objCategory: Category) =>
                                objCategory.id === "111050000000018392" ||
                                objCategory.id === "111050000000018393" ||
                                objCategory.id === "111050000000018400"
                        );

                        filteredCategory.forEach((objCategory: Category) => {
                            objCategory.name = objCategory?.name?.replace(
                                /centax /gi,
                                ""
                            );
                            objCategory.name = objCategory?.name?.replace("Centax ", "");
                        });
                        indexDocument.categories = filteredCategory;
                    }

                    indexDocumentList.push(indexDocument);
                    console.log('----15');

                    const jsonString = JSON.stringify(indexDocument, null, 2);
                    const filePath = "result.json"; // You can change the file name and path as needed.
                    fs.writeFile(filePath, jsonString, "utf8", (err: any) => {
                        if (err) {
                            console.error("Error writing to file:", err);
                        } else {
                            console.log("JSON data has been written to the file.");
                        }
                    });


                }
                catch (ex: any) {
                    console.error("error: " + dr["mid"] + ex.message);
                    Common.LogErrorId(dr["mid"]?.toString());
                }
            }
            console.log("Document Batch No completed: " + i + "\r\n");
            let status = "";
            // if (indexType === 1) {
            //     status = await bulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexName, IndexDocument, docType);
            //   } else if (indexType === 2) {
            //     status = await bulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexNameStopword, IndexDocument, docType);
            //   } else if (indexType === 3) {
            //     status = await bulkIndexingAnalyserTesting(indexDocumentList, "x", IndexLocalPath, IndexNameTest, IndexDocument, docType);
            //   } else {
            //     status = await saveJson(indexDocumentList);
            //   }
            //GC.Collect();
        }

        // The rest of your code for processing dataRows and adding to indexDocumentList will go here
    }
    return reccount;
}

async function CaseLawsPartialIndex(dt: any, docType: number, templateid: string): Promise<number> {
    let indexDocumentList: IndexDocument[] = [];
    const batchSize: number = 100; // magic
    const totalBatches: number = Math.ceil(dt.Rows.Count / batchSize);
    console.log("Total Document Batch Started: " + totalBatches);

    let reccount: number = 0;
    for (let i = 0; i < totalBatches; i++) {
        console.log("Document Batch No started: " + i);
        const dataRows = dt.AsEnumerable().Skip(i * batchSize).Take(batchSize);

        if (dataRows.Count() > 0) {
            reccount = dataRows.Count();

            for (const dr of dataRows) {
                try {
                    let objSuggest: CompletionField[] = [];

                    // console.log("log start for actid:" + dr["mid"]);

                    let indexDocument: IndexDocument = {
                        id: dr["mid"].toString().trim(),
                        mid: dr["id"].toString().trim(),
                    };

                    let objMasters: Masterinfo = {} as Masterinfo;
                    let objMasterInfo: Info = {} as Info;
                    let objAssociates: Associates = {} as Associates;

                    //#region act associations

                    const associationArray = !!dr["actassociations"] ? dr["actassociations"].toString().split("$") : null;
                    const objActs: GenericInfo[] = [];
                    const objSections: GenericInfo[] = [];
                    const objActAssociations: Associate[] = [];
                    const objSectionAssociations: Associate[] = [];
                    const sections: string[] = [];

                    if (associationArray != null && associationArray.length > 1) {
                        for (const association of associationArray) {
                            const associations = association.split("|");
                            if (associations != null && associations.length > 1) {
                                const objAct: GenericInfo = {} as GenericInfo;
                                const objSection: GenericInfo = {} as GenericInfo;
                                const objActAssociate: Associate = {} as Associate;
                                const objSectionAssociate: Associate = {} as Associate;

                                const actidsecid = associations[0].indexOf("#") != -1 ? associations[0].trim().split("#") : null;
                                const type = associations[0] != "" ? associations[1].split("^")[0].toLowerCase() : "";

                                if (type.toLowerCase().trim() == "act") {
                                    if (!!associations[0]) {
                                        if (Common.CasePopularActsfinal().hasOwnProperty(associations[0].trim())) {
                                            const categories = Common.CasePopularActsfinal()[associations[0].trim()][1].split(",");
                                            objAct.id = objActAssociate.id = associations[0].trim();
                                            objAct.type = objActAssociate.type = type;
                                            objAct.name = objActAssociate.name = associations[1] != "" ? associations[1].split("^")[1].split("~")[0] : "";
                                            objAct.shortName = "";
                                            objAct.ordering = associations[1].split("^")[1].split("~")[1];
                                            objAct.orderInteger = 0;
                                            objActAssociate.associatedDocid = "";
                                            objAct.url = objActAssociate.url = Common.GetUrl(objActAssociate.name.toLowerCase());
                                            objAct.catUrls = categories;
                                        } else {
                                            const categories = Common.OtherActs()["999999999999999999"][1].split(",");
                                            objAct.id = "999999999999999999";
                                            objAct.type = type;
                                            objAct.name = "Other Acts";
                                            objAct.shortName = "";
                                            objAct.ordering = "999999999";
                                            objAct.orderInteger = 0;
                                            objAct.url = Common.GetUrl(objAct.name.toLowerCase());
                                            objAct.catUrls = categories;
                                            objActAssociate.id = associations[0].trim();
                                            objActAssociate.type = type;
                                            objActAssociate.name = associations[1] != "" ? associations[1].split("^")[1].split("~")[0] : "";
                                            objActAssociate.ordering = associations[1].split("^")[1].split("~")[1];
                                            objActAssociate.associatedDocid = "";
                                            objActAssociate.url = Common.GetUrl(objActAssociate.name.toLowerCase());
                                        }
                                        if (!!objAct.name.trim()) {
                                            objSuggest.push({
                                                Input: [objAct.name.toLowerCase().trim()],
                                                Weight: 20,
                                            });
                                        }
                                        objActs.push(objAct);
                                        objActAssociations.push(objActAssociate);
                                    }
                                } else {
                                    let objSByte: number;
                                    let section = associations[1] != "" ? associations[1].split("^")[1] : "";
                                    if (!!section && !isNaN(Number(section[0]))) {
                                        section = "Section - " + section;
                                    }

                                    if (!!actidsecid[1]) {
                                        const parentsectioininfo = !!dr["parentsectioninfo"] ? dr["parentsectioninfo"].toString().split("$") : null;
                                        let isparentsection = false;
                                        if (parentsectioininfo != null) {
                                            for (const parentsection of parentsectioininfo) {
                                                if (parentsection.indexOf(actidsecid[1].trim()) != -1) {
                                                    const parentsectionidname = parentsection.substring(parentsection.indexOf("#")).split("|");
                                                    objSectionAssociate.id = parentsectionidname[0].replace("#", " ").trim();
                                                    objSectionAssociate.name = parentsectionidname[1].replace("^", "-").split("~")[0];
                                                    objSectionAssociate.ordering = parentsectionidname[1].replace("^", "-").split("~")[1];
                                                    objSectionAssociate.actsectionid = actidsecid[0].trim() + parentsectionidname[0].replace("#", " ").trim();
                                                    isparentsection = true;
                                                }
                                            }
                                        }
                                        const sectionName = section.indexOf("~") != -1 ? section.split("~")[0].trim() : section.trim();
                                        if (!!sectionName) {
                                            if (Common.CasePopularActsfinal().hasOwnProperty(actidsecid[0].trim())) {
                                                objSection.id = actidsecid[1];
                                                objSection.pid = actidsecid[0];
                                                objSection.actsectionid = actidsecid[0] + actidsecid[1];
                                                objSection.type = type;
                                                objSection.name = sectionName;
                                                objSection.shortName = "";
                                                objSection.ordering = section.indexOf("~") != -1 ? section.split("~")[1] : "";
                                                objSection.orderInteger = 0;
                                                objSection.url = Common.GetUrl(objSection.name.toLowerCase());
                                                if (!isparentsection) {
                                                    objSectionAssociate.id = actidsecid[1];
                                                    objSectionAssociate.name = sectionName;
                                                    objSectionAssociate.ordering = section.indexOf("~") != -1 ? section.split("~")[1] : "";
                                                    objSectionAssociate.actsectionid = actidsecid[0].trim() + actidsecid[1].trim();
                                                }
                                                objSectionAssociate.type = type;
                                                objSectionAssociate.associatedDocid = actidsecid[0];
                                                objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name.toLowerCase());
                                            } else {
                                                if (!!sectionName) {
                                                    if (!isparentsection) {
                                                        objSectionAssociate.id = actidsecid[1];
                                                        objSectionAssociate.name = sectionName;
                                                        objSectionAssociate.ordering = section.indexOf("~") != -1 ? section.split("~")[1] : "";
                                                        objSectionAssociate.actsectionid = actidsecid[0].trim() + actidsecid[1].trim();
                                                    }
                                                    objSectionAssociate.type = type;
                                                    objSectionAssociate.associatedDocid = actidsecid[0];
                                                    objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name.toLowerCase());
                                                }
                                            }
                                            if (!!objSection.name) {
                                                sections.push(objSection.name.toLowerCase().trim());
                                            }
                                            objSections.push(objSection);
                                            objSectionAssociations.push(objSectionAssociate);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (sections.length > 0) {
                        objSuggest.push({
                            Input: sections,
                            Weight: 1,
                        });
                    }

                    const caactsectionsarray = !!dr["CaComparison"] ? dr["CaComparison"].toString().split("$") : null;
                    const obj1956sections: casections[] = [];

                    if (caactsectionsarray != null && caactsectionsarray.length > 1) {
                        for (const caassociation of caactsectionsarray) {
                            const obj1956section: casections = {} as casections;
                            const caassociations = caassociation.split("|");

                            if (caassociations != null && caassociations.length > 1) {
                                const caactssections = caassociation.split("|");
                                const ca1956actsection = caactssections[0].split("^");

                                if (ca1956actsection != null) {
                                    obj1956section.id = ca1956actsection[2].trim();
                                    obj1956section.name = ca1956actsection[3].trim().replace(' ', '-');
                                    obj1956section.actname = "Companies Act, 1956";
                                    obj1956section.url = Common.GetUrl(obj1956section.name.toLowerCase());
                                }

                                const obj2013sections: ca2013section[] = [];
                                for (const actsection of caactssections) {
                                    const actsections = actsection.split('^');
                                    if (actsection.indexOf("102010000000000793") != -1) {
                                        const obj2013section: ca2013section = {} as ca2013section;
                                        obj2013section.id = actsections[2].trim();
                                        obj2013section.name = actsections[3].trim().replace(' ', '-');
                                        obj2013section.actname = "Companies Act, 2013";
                                        obj2013section.url = Common.GetUrl(obj2013section.name.toLowerCase());
                                        obj2013sections.push(obj2013section);
                                    }
                                }

                                obj1956section.ca2013section = obj2013sections;
                                obj1956sections.push(obj1956section);
                            }
                        }
                    }

                    objAssociates.act = objActAssociations;
                    objAssociates.section = objSectionAssociations;
                    indexDocument.associates = objAssociates;
                    objMasterInfo.act = objActs;
                    objMasterInfo.section = objSections;
                    objMasters.info = objMasterInfo;
                    indexDocument.masterinfo = objMasters;

                    //#endregion

                    indexDocumentList.push(indexDocument);


                } catch (ex) {
                    Common.LogError(ex, "mid = " + dr["mid"]);
                    console.log("error:", dr["mid"], ex.message);
                    Common.LogErrorId(dr["mid"].toString());
                }
            }
            console.log(`Document Batch No completed: ${i}\n`);
            // let status = "";
            // if (indexType === 1) {
            //     status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, System.Configuration.ConfigurationManager.AppSettings["IndexName"], IndexDocument, docType);
            // } else {
            //     status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexNameStopword, IndexDocument, docType);
            // }
            //GC.Collect();

        }
    }

    // Return the reccount (total number of processed records)
    return reccount;
}

async function FormIndex(dt: any, docType: number, templateid: string): Promise<void> {
    const batchSize: number = 100; // magic
    const totalBatches: number = Math.ceil(dt.Rows.length / batchSize);
    console.log("Total Document Batch Started:" + totalBatches + "\r\n");

    for (let i = 0; i < totalBatches; i++) {
        const indexDocumentList: IndexDocument[] = [];
        console.log("Document Batch No started:" + i + "\r\n");
        const dataRows = dt.AsEnumerable().slice(i * batchSize, (i + 1) * batchSize);

        if (dataRows.length > 0) {
            for (const dr of dataRows) {
                const objSuggest: CompletionField[] = [];
                //console.log("log start for actid:" + dr["mid"] + "\r\n");

                try {
                    let elasticPDFPath = "";
                    const indexDocument: IndexDocument = {
                        id: dr["mid"].toString().trim(),
                        mid: dr["id"].toString().trim(),
                        templateid: templateid,
                        documenttype: dr["documenttype"].toString().toLowerCase().trim(),
                        documentformat: dr["documentformat"].toString().toLowerCase().trim(),
                        filenamepath: (elasticPDFPath = dr["filenamepath"].toString().trim()),
                    };

                    if (dr["url"].toString().toLowerCase().indexOf(".pdf") !== -1 && !!indexDocument && !!indexDocument.filenamepath) {
                        // indexDocument.filenamepath = await Common.UploadPdfFilesOnAmazonS3Bucket(
                        //     indexDocument.id,
                        //     indexDocument.filenamepath
                        // );
                    }

                    //indexDocument.filenamepath = new Common().pdfFileManagement(indexDocument.id, indexDocument.filenamepath, "");
                    //Common.CopyLinkFiles(indexDocument.mid, indexDocument.id);
                    //Common.UploadImageOnAmazonS3Bucket(indexDocument.id);

                    const year = dr["year"].toString().trim();
                    if (!!year && year.indexOf("0000") === -1) {
                        if (year.length > 4) {
                            indexDocument.year = { id: year.substring(0, 18).trim(), name: year.substring(18, 4).trim() };
                        } else {
                            indexDocument.year = { id: year.trim(), name: year.trim() };
                        }
                    }
                    //else {
                    //    indexDocument.year = { id: "", name: "" };
                    //}         

                    //#region act associations
                    let associationArray = !!dr["DDA_Acts"] ? String(dr["DDA_Acts"]).split('$') : null;
                    if (associationArray != null && associationArray.length > 1) {
                        let objActAssociations: Associate[] = [];
                        let objSectionAssociations: Associate[] = [];
                        let objAssociates: Associates = {} as Associates;

                        for (let association of associationArray) {
                            let associations = association.split('|');

                            if (associations != null && associations.length > 1) {
                                let objActAssociate: Associate = {} as Associate;
                                let objSectionAssociate: Associate = {} as Associate;
                                let actidsecid = associations[0].indexOf('#') !== -1 ? String(associations[0]).trim().split('#') : null;
                                let type = associations[0] !== "" ? associations[1].split('^')[0].toLowerCase() : "";

                                if (type.trim() === "act") {
                                    if (!!associations[0]) {
                                        objActAssociate.id = associations[0].trim();
                                        objActAssociate.type = type;
                                        objActAssociate.name = associations[1] !== "" ? associations[1].split('^')[1] : "";
                                        objActAssociate.associatedDocid = "";
                                        objActAssociate.url = Common.GetUrl(objActAssociate.name.toLowerCase());

                                        objActAssociations.push(objActAssociate);
                                    }
                                } else {
                                    let objSBytes: number;
                                    let section = associations[1] !== "" ? associations[1].split('^')[1] : "";

                                    if (!!section && !isNaN(Number(section.charAt(0)))) {
                                        section = "Section - " + section;
                                    }

                                    if (!!actidsecid && !!(actidsecid[1])) {
                                        objSectionAssociate.id = actidsecid[1];
                                        objSectionAssociate.type = type;
                                        objSectionAssociate.name = section.indexOf('~') !== -1 ? section.split('~')[0] : section;
                                        objSectionAssociate.ordering = section.indexOf('~') !== -1 ? section.split('~')[1] : "";

                                        objSectionAssociate.associatedDocid = actidsecid[0];
                                        objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name.toLowerCase());

                                        objSectionAssociations.push(objSectionAssociate);
                                    }
                                }
                            }
                        }

                        objAssociates.act = objActAssociations;
                        objAssociates.section = objSectionAssociations;
                        indexDocument.associates = objAssociates;
                    }

                    //#endregion

                    //#region CAT SUBCAT BINDING
                    let catSubCatArray = !!dr?.["categoriescentax"] ? String(dr["categoriescentax"])?.split('$') : null;
                    if (catSubCatArray != null) {
                        let objCatList: Category[] = [];
                        for (let catsubcat of catSubCatArray) {
                            if (!!catsubcat) {
                                let objCat: Category = {} as Category;
                                let objSubCat: Subcategory = {} as Subcategory;
                                let isprimarycat = catsubcat?.split('%')?.length > 1 ? parseInt(catsubcat?.split('%')?.[1]) : 0;

                                if (catsubcat?.indexOf('|') > 0) {
                                    let catidname = !!catsubcat ? catsubcat?.split('|') : null;
                                    let mainCat = catidname?.[1]?.trim()?.split('^')?.[0]?.trim();
                                    let isRequiredCategory =
                                        mainCat?.includes("111050000000018392") ||
                                        mainCat?.includes("111050000000018393") ||
                                        mainCat?.includes("111050000000018400") ||
                                        mainCat?.includes("111050000000018768") ||
                                        mainCat?.includes("111050000000018769") ||
                                        mainCat?.includes("111050000000018770") ||
                                        mainCat?.includes("111050000000018771") ||
                                        mainCat?.includes("111050000000018772") ||
                                        mainCat?.includes("111050000000019031");

                                    if (!isRequiredCategory) {
                                        continue;
                                    }

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objCat.id = catidname?.[1]?.trim()?.split('^')?.[0]?.trim();
                                            objCat.name = catidname?.[1]?.split('^')?.[1]?.trim()?.split('%')?.[0];
                                            objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.competitionCategoryId:
                                            objCat.id = Constants.competitionCategoryId;
                                            objCat.name = Constants.competitionCategory;
                                            objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.tpCategoryId:
                                            objCat.id = Constants.tpCategoryId;
                                            objCat.name = Constants.tpCategory;
                                            objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.iltCategoryId:
                                            objCat.id = Constants.iltCategoryId;
                                            objCat.name = Constants.iltCategory;
                                            objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        default:
                                            objCat.id = catidname?.[0]?.trim()?.split('^')?.[0]?.trim();
                                            objCat.name = catidname?.[0]?.split('^')?.[1]?.trim()?.split('%')?.[0];
                                            objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                    }

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            if (catidname) objSubCat.id = catidname?.[2]?.trim()?.split('^')?.[0]?.trim();
                                            if (catidname) objSubCat.name = catidname?.[2]?.split('^')?.[1]?.trim()?.split('%')?.[0];
                                            objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                            break;
                                        case Constants.competitionCategoryId:
                                            objSubCat.id = Constants.competitionCategoryId;
                                            objSubCat.name = Constants.competitionCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                            break;
                                        case Constants.tpCategoryId:
                                            objSubCat.id = Constants.tpCategoryId;
                                            objSubCat.name = Constants.tpCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                            break;
                                        case Constants.iltCategoryId:
                                            objSubCat.id = Constants.iltCategoryId;
                                            objSubCat.name = Constants.iltCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                            break;
                                        default:
                                            if (catidname) objSubCat.id = catidname?.[0]?.trim()?.split('^')?.[0]?.trim();
                                            if (catidname) objSubCat.name = catidname?.[1]?.split('^')?.[1]?.trim()?.split('%')?.[0];
                                            objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                            break;
                                    }

                                    objCat.subcategory = objSubCat;
                                } else {
                                    objCat.id = catsubcat?.split('^')?.[0]?.trim();
                                    objCat.name = catsubcat?.split('^')?.[1]?.trim()?.split('%')?.[0];
                                    objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                    objCat.isprimarycat = isprimarycat;

                                    objSubCat.id = "";
                                    objSubCat.name = "";
                                    objSubCat.url = "";
                                    objCat.subcategory = objSubCat;
                                }

                                objCatList.push(objCat);
                            }
                        }

                        indexDocument.categories = objCatList;
                    }


                    //#endregion

                    //#region Groups binding
                    let groupSubgroupArray = !!dr?.["groups"] ? String(dr["groups"])?.split('|') : null;
                    if (groupSubgroupArray != null) {
                        let objGroups: Groups = {} as Groups;
                        let objSubGroup: Subgroup = {} as Subgroup;
                        objSubGroup.id = groupSubgroupArray?.[1]?.split('^')?.[0]?.trim();
                        objSubGroup.name = groupSubgroupArray?.[1]?.split('^')?.[1]?.trim();
                        objSubGroup.url = Common.GetUrl(objSubGroup?.name?.toLowerCase());

                        let groupSubgroup = groupSubgroupArray?.[0]?.split('^');
                        let groupId = groupSubgroup?.[0]?.trim();
                        let groupName = docType === 3 ? "form" : groupSubgroup?.[1]?.trim();

                        objGroups.group = {
                            id: groupId,
                            name: groupName,
                            url: docType === 3 ? "form" : Common.GetUrl(groupName?.toLowerCase()?.trim()),
                            subgroup: objSubGroup
                        } as Group;

                        indexDocument.groups = objGroups;

                        if (!objSubGroup?.name?.trim()) {
                            objSuggest?.push({
                                Input: [objSubGroup?.name?.toLowerCase()?.trim()],
                                Weight: 20
                            } as CompletionField);
                        }
                    }
                    //#endregion
                    let objSByte: number;

                    if (docType === 3) {
                        let form = String(dr["Heading"]);
                        if (!form?.trim() || !isNaN(Number(form?.charAt(0)))) {
                            form = "Form - " + form;
                        }
                        indexDocument.heading = form;
                    }

                    indexDocument.subheading = String(dr["subheading"])?.trim();
                    indexDocument.sortheading = String(dr["sortheading"])?.toLowerCase()?.trim();
                    indexDocument.sortheadingnumber = String(dr["sortheadingnumber"])?.toLowerCase()?.trim();
                    indexDocument.searchheadingnumber = String(dr["searchheadingnumber"])?.toLowerCase()?.trim();

                    if (docType === 3) {
                        indexDocument.parentheadings = [{ id: "", name: "", ordering: "", orderInteger: 0 }];
                    }

                    indexDocument.url = String(dr["url"])?.toLowerCase()?.trim();
                    indexDocument.language = String(dr["language"])?.toLowerCase()?.trim();

                    //#region subject master
                    let caseSubjectArray = !!dr?.["FormSubject"] ? String(dr["FormSubject"])?.split('$') : null;
                    let objsubjects: GenericInfo[] = [];

                    if (caseSubjectArray != null && caseSubjectArray.length > 1) {
                        for (let association of caseSubjectArray) {
                            let associations = association?.split('|');

                            if (associations != null && association.length > 1) {
                                let objSubject: GenericInfo = {} as GenericInfo;

                                let type = associations?.[0] !== "" ? associations?.[1]?.split('^')?.[0]?.toLowerCase() : "";

                                if (type?.trim() === "subject") {
                                    if (!!associations?.[0]) {
                                        //string[] categories = Common.CasePopularActs()[associations[0]?.trim()]?.[1]?.split(',');
                                        objSubject.id = associations?.[0]?.trim();
                                        objSubject.type = type;
                                        objSubject.name = associations?.[1] !== "" ? associations?.[1]?.split('^')?.[1]?.split('~')?.[0] : "";
                                        objSubject.shortName = "";
                                        objSubject.ordering = associations?.[1]?.split('^')?.[1]?.split('~')?.[1];
                                        objSubject.orderInteger = 0;
                                        objSubject.url = Common.GetUrl(objSubject?.name?.toLowerCase());
                                        //objSubject.catUrls = categories;
                                        objsubjects.push(objSubject);

                                        if (!!objSubject?.name?.trim()) {
                                            objSuggest?.push({
                                                Input: [objSubject?.name?.toLowerCase()?.trim()],
                                                Weight: 18
                                            } as CompletionField);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    //#endregion

                    let multipleMasterInfo = !!dr?.["masterinfo"] ? String(dr["masterinfo"])?.split('$') : null;
                    let objMasters: Masterinfo = {} as Masterinfo;
                    let objMasterInfo: Info = {} as Info;

                    let objForms: GenericInfo[] = [];
                    let objStates: GenericInfo[] = [];
                    let objlanguages: GenericInfo[] = [];
                    let objinstructions: GenericInfo[] = [];
                    let objFormTypes: GenericInfo[] = [];

                    if (multipleMasterInfo != null && multipleMasterInfo.length > 1) {
                        for (let masterInfo of multipleMasterInfo) {
                            if (!!masterInfo) {
                                let objform: GenericInfo = {} as GenericInfo;
                                let objstate: GenericInfo = {} as GenericInfo;
                                let objformtype: GenericInfo = {} as GenericInfo;

                                let masterinfo = !!masterInfo ? String(masterInfo).split('|') : null;

                                if (!!masterInfo) {
                                    let objlanguage: GenericInfo = {} as GenericInfo;
                                    let objinstruction: GenericInfo = {} as GenericInfo;

                                    let type = String(masterinfo?.[1]?.split('^')?.[0])?.toLowerCase()?.trim();//Type

                                    if (docType === 3) {
                                        let parentName = String(masterinfo?.[1]?.split('^')?.[1]);

                                        let MainPdfurl = "";
                                        if (type === "language") {
                                            let langInst = !!String(masterinfo?.[1]?.split('^')?.[1]) ? String(masterinfo?.[1]?.split('^')?.[1])?.split(',') : null;
                                            if (!!langInst?.[0]) {
                                                objlanguage.id = String(masterinfo?.[0])?.trim();
                                                objlanguage.name = String(langInst?.[0])?.trim();
                                                objlanguage.ordering = objlanguage?.name?.indexOf("#") !== -1 ? objlanguage?.name?.split('#')?.[1]?.trim() : "";
                                                objlanguage.orderInteger = !!objlanguage?.ordering ? parseInt(objlanguage?.ordering) : 0;
                                                objlanguage.type = type;
                                                objlanguage.url = objlanguage?.name?.toLowerCase() === "english" ? elasticPDFPath : elasticPDFPath.replace(".pdf", "-" + objlanguage?.name + ".pdf").replace(".PDF", "-" + objlanguage?.name + ".pdf");
                                                MainPdfurl = objlanguage?.url;
                                                objlanguage.url = Common.pdfFileManagement(indexDocument.mid, objlanguage?.url, objlanguage?.type);
                                                indexDocument.filenamepath = objlanguage?.url;
                                                objlanguages?.push(objlanguage);
                                            }

                                            if (!!langInst && langInst?.length > 1 && !!langInst?.[1]) {
                                                objinstruction.id = String(masterinfo?.[0])?.trim();
                                                objinstruction.type = "Instruction";//Type
                                                objinstruction.name = String(langInst?.[1])?.trim();
                                                objinstruction.ordering = objinstruction?.name?.indexOf("#") !== -1 ? objinstruction?.name?.split('#')?.[1]?.trim() : "";
                                                objinstruction.orderInteger = !!objinstruction?.ordering ? parseInt(objinstruction?.ordering) : 0;
                                                objinstruction.url = Common.pdfFileManagement(indexDocument.mid, MainPdfurl?.replace("FormITR", "Instructions"), objinstruction?.type);
                                                objinstructions?.push(objinstruction);
                                            }
                                        } else if (type.toLowerCase() === "form") {
                                            if (parentName?.indexOf('#') !== -1) {
                                                let nameOrder = parentName?.split('#');
                                                objform.id = String(masterinfo?.[0])?.trim();
                                                objform.name = String(nameOrder?.[0]);
                                                objform.ordering = nameOrder?.[1]?.replace('$', ' ')?.trim();
                                                objform.orderInteger = !!objform?.ordering ? parseInt(objform?.ordering) : 0;
                                                objform.type = type;
                                            } else {
                                                objform.id = String(masterinfo?.[0])?.trim();
                                                objform.name = parentName;
                                                objform.ordering = "";
                                                objform.orderInteger = 0;
                                                objform.type = type;
                                            }
                                            objform.url = Common.GetUrl(objform?.name?.toLowerCase());
                                            objForms?.push(objform);
                                        } else if (type.toLowerCase() === "state") {
                                            if (parentName?.indexOf('#') !== -1) {
                                                let nameOrder = parentName?.split('#');
                                                objstate.id = String(masterinfo?.[0])?.trim();
                                                objstate.name = String(nameOrder?.[0]);
                                                objstate.ordering = nameOrder?.[1];
                                                objstate.orderInteger = !!objstate?.ordering ? parseInt(objstate?.ordering) : 0;
                                                objstate.type = type;
                                            } else {
                                                objstate.id = String(masterinfo?.[0])?.trim();
                                                objstate.name = parentName;
                                                objstate.ordering = "";
                                                objstate.orderInteger = 0;
                                                objstate.type = type;
                                            }
                                            objstate.url = Common.GetUrl(objstate?.name?.toLowerCase());
                                            objStates?.push(objstate);
                                        } else if (type.toLowerCase() === "formtype") {
                                            if (parentName?.indexOf('#') !== -1) {
                                                let nameOrder = parentName?.split('#');
                                                objformtype.id = String(masterinfo?.[0])?.trim();
                                                objformtype.name = String(nameOrder?.[0]);
                                                objformtype.ordering = nameOrder?.[1];
                                                objformtype.orderInteger = !!objformtype?.ordering ? parseInt(objformtype?.ordering) : 0;
                                                objformtype.type = type;
                                            } else {
                                                objformtype.id = String(masterinfo?.[0])?.trim();
                                                objformtype.name = parentName;
                                                objformtype.ordering = "";
                                                objformtype.orderInteger = 0;
                                                objformtype.type = type;
                                            }
                                            objformtype.url = Common.GetUrl(objformtype?.name?.toLowerCase());
                                            objFormTypes?.push(objformtype);
                                        }
                                    }
                                }
                            }
                            // #region masterinfoformno
                            let masterInfoFormNo: GenericInfo[] = [];
                            let mIFormNo: GenericInfo = {} as GenericInfo;
                            mIFormNo.type = "form";
                            if (indexDocument && indexDocument.heading) mIFormNo.name = indexDocument?.heading;
                            mIFormNo.orderInteger = 0;
                            if (indexDocument && indexDocument.heading) mIFormNo.url = indexDocument.heading.replace(" ", "").toLowerCase();
                            masterInfoFormNo.push(mIFormNo);
                            objMasterInfo.formno = masterInfoFormNo;
                            // #endregion masterinfo formno

                            objMasterInfo.language = objlanguages;
                            objMasterInfo.instruction = objinstructions;
                            objMasterInfo.form = objForms;
                            objMasterInfo.formtype = objFormTypes;
                            objMasterInfo.state = objStates;
                            objMasterInfo.subject = objsubjects;
                            objMasters.info = objMasterInfo;
                            indexDocument.masterinfo = objMasters;
                        }
                    }

                    let masterinfotext = !String(dr["masterinfo"]).toLowerCase().includes("$frmtyp") ? String(dr["masterinfo"]).toLowerCase().substring(0, String(dr["masterinfo"]).toLowerCase().indexOf("$frmtyp")) : String(dr["masterinfo"]).toLowerCase();
                    indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(
                        String(dr["categoriescentax"]).toLowerCase() + " " +
                        String(dr["groups"]).toLowerCase() + " " +
                        String(dr["year"]).toLowerCase() + " " +
                        Common.StringOnly(masterinfotext) + " " +
                        String(dr["Heading"]).trim() + " " +
                        String(dr["subheading"]).trim()
                    );
                    indexDocument.shortcontent = String(dr["shortcontent"]).trim();

                    // #region footnote region
                    let fullContent = "";
                    let footnotecontent: string[] = [];
                    let doc = new DOMParser().parseFromString(String(dr["fullcontent"]), "text/html");
                    let isHtmlFootnote = doc.querySelectorAll("div.footprint").length > 0;

                    if (isHtmlFootnote && indexDocument.documentformat === ".htm") {
                        for (let item of doc.querySelectorAll("div.footprint")) {
                            item.remove();
                            footnotecontent.push(item.outerHTML);
                        }
                        let serializer = new XMLSerializer();
                        fullContent = serializer.serializeToString(doc);
                    } else if (String(dr["fullcontent"]).indexOf("<footnote>") !== -1) {
                        let regexfootnote = /<footnote>(.*?)<\/footnote>/gis;
                        let matchesfootnote = String(dr["fullcontent"]).match(regexfootnote);
                        if (matchesfootnote) {
                            footnotecontent = matchesfootnote;
                        }
                        fullContent = String(dr["fullcontent"]).replace(regexfootnote, "");
                    } else {
                        fullContent = String(dr["fullcontent"]);
                    }
                    indexDocument.footnotecontent = footnotecontent.join("");
                    // #endregion footnote

                    // #region remove header tag from full content
                    if (String(dr["fullcontent"]).indexOf("<header>") !== -1) {
                        fullContent = Common.RemovedHeaderTag(fullContent);
                    }
                    // #endregion

                    // #region xml meta tag
                    if (String(dr["fullcontent"]).indexOf("<header>") !== -1) {
                        indexDocument.xmltag = Common.GetMetaTag(String(dr["fullcontent"]));
                    } else {
                        indexDocument.xmltag = "";
                    }
                    // #endregion

                    indexDocument.fullcontent = fullContent.trim().endsWith("</document>") ?
                        fullContent.trim().replace("</document>", "<div id='xmlmetadata' style='display:none;'>" + indexDocument.searchboosttext + "</div></document>") :
                        fullContent.trim().endsWith("</html>") ?
                            fullContent.trim().replace("</html>", "<div id='htmmetadata' style='display:none;'>" + indexDocument.searchboosttext + "</div></html>") :
                            fullContent.trim() + "<div id='nodata' style='display:none;'>" + indexDocument.searchboosttext + "</div>";

                    // Tagging Info
                    let taggingInfo: string[] | null = !dr["TaggingInfo"] ? String(dr["TaggingInfo"]).split('$') : null;
                    let objTags: Taginfo[] = [];

                    if (taggingInfo != null && taggingInfo.length > 0) {
                        for (let taginfo of taggingInfo) {
                            let taginfos: string[] | null = taginfo ? taginfo.split('|') : null;
                            if (taginfo && taginfos != null) {
                                let objtaginfo: Taginfo = {} as Taginfo;
                                objtaginfo.id = taginfos[1].split('^')[0];
                                objtaginfo.name = taginfos[1].split('^')[1];
                                objTags.push(objtaginfo);
                            }
                        }
                    } else {
                        let taginfos: string[] | null = dr["TaggingInfo"] ? String(dr["TaggingInfo"]).split('|') : null;
                        if (taginfos != null && taginfos.length > 1) {
                            let objtaginfo: Taginfo = {} as Taginfo;
                            objtaginfo.id = taginfos[1].split('^')[0];
                            objtaginfo.name = taginfos[1].split('^')[1];
                            objTags.push(objtaginfo);
                        }
                    }

                    indexDocument.taginfo = objTags;

                    if (dr["TaggingInfo"].toString().trim() !== "" &&
                        (dr["TaggingInfo"].toString() === "222210000000000002|TC1^Repealed Act" ||
                            dr["TaggingInfo"].toString() === "222210000000000041|TC_Service_Tax_Repealed^Service Tax Repealed"
                            //|| dr["TaggingInfo"].toString() === "222210000000000037|TCIBCOtheractrule^IBC Other act rule"
                            //|| dr["TaggingInfo"].toString() === "222210000000000038|TCewaybill^e-way bill" 
                            //|| dr["TaggingInfo"].toString() === "222210000000000039|FORM_Not_available^FORM Not available"
                        )) {
                        indexDocument.documenttypeboost = 0;
                    } else {
                        indexDocument.documenttypeboost = 7500;
                    }

                    if (indexDocument && indexDocument.heading && indexDocument.heading.trim() !== "") {
                        objSuggest.push({
                            Input: [indexDocument.heading.toLowerCase().trim()],
                            Weight: 1
                        });
                    }

                    indexDocument.documentdate = dr["documentdate"]?.toString().split('^')[0] ?? "19000101";
                    if (indexDocument && indexDocument.documentdate)
                        indexDocument.formatteddocumentdate = indexDocument.documentdate !== ""
                            ? new Date(`${indexDocument.documentdate.substring(0, 4)}-${indexDocument.documentdate.substring(4, 2)}-${indexDocument.documentdate.substring(6, 2)}`)
                            : new Date("1900-01-01");

                    indexDocument.created_date = dr["created_date"]?.toString().length === 14
                        ? new Date(`${dr["created_date"].toString().substring(0, 4)}-${dr["created_date"].toString().substring(4, 2)}-${dr["created_date"].toString().substring(6, 2)} ${dr["created_date"].toString().substring(8, 2)}:${dr["created_date"].toString().substring(10, 2)}:${dr["created_date"].toString().substring(12, 2)}`)
                        : new Date("1900-01-01");

                    indexDocument.Suggest = objSuggest;
                    if (indexDocument && indexDocument.documentdate) {
                        let formatteddate = indexDocument.documentdate !== ""
                            ? `${indexDocument.documentdate.substring(0, 4)}-${indexDocument.documentdate.substring(4, 2)}-${indexDocument.documentdate.substring(6, 2)}`
                            : "1900-01-01";
                    }
                    if (dr["UpdatedDate"]?.toString().length > 13) {
                        indexDocument.updated_date = new Date(`${dr["UpdatedDate"].toString().substring(0, 4)}-${dr["UpdatedDate"].toString().substring(4, 2)}-${dr["UpdatedDate"].toString().substring(6, 2)} ${dr["UpdatedDate"].toString().substring(8, 2)}:${dr["UpdatedDate"].toString().substring(10, 2)}:${dr["UpdatedDate"].toString().substring(12, 2)}`);
                    } else if (dr["UpdatedDate"]?.toString().trim().length === 8) {
                        indexDocument.updated_date = new Date(`${dr["UpdatedDate"].toString().substring(0, 4)}-${dr["UpdatedDate"].toString().substring(4, 2)}-${dr["UpdatedDate"].toString().substring(6, 2)}`);
                    }

                    indexDocument.ispublished = true;
                    indexDocument.lastpublished_date = new Date();
                    indexDocument.lastQCDate = new Date();
                    indexDocument.isshowonsite = true;
                    indexDocument.boostpopularity = 1000;
                    indexDocument.viewcount = 10;

                    let filteredCategory: Category[] = [];
                    if (indexDocument && indexDocument.categories)
                        for (const objCategory of indexDocument.categories) {
                            const isRequiredCategory = (objCategory.id === "111050000000018392" || objCategory.id === "111050000000018393" || objCategory.id === "111050000000018400");
                            if (objCategory.name)
                                objCategory.name = objCategory.name.replace(/centax /gi, "").replace(/Centax /gi, "");
                            if (isRequiredCategory) {
                                filteredCategory.push(objCategory);
                            }
                        }
                    indexDocument.categories = filteredCategory;



                    indexDocumentList.push(indexDocument);
                } catch (ex) {
                    const mid = dr["mid"].toString();
                    Common.LogError(ex, `MID = ${mid}`);
                    console.error(`error: ${mid} ${ex.message}`);
                    Common.LogErrorId(mid);
                }

            }
            console.log(`Document Batch No completed: ${i}`);

            let status: string = '';
            if (indexType === 1) {
                // status = await BulkIndexing(indexDocumentList, 'x', IndexLocalPath, IndexName, IndexDocument, docType);
            } else {
                // status = await BulkIndexing(indexDocumentList, 'x', IndexLocalPath, IndexNameStopword, IndexDocument, docType);
            }
        }
    }

    // At this point, the indexDocumentList contains the processed data
    // Continue with the rest of your logic using the updated indexDocumentList
}

async function CirNotIndex(dt: any, docType: number, templateid: string): Promise<number> {
    // const indexDocumentList: IndexDocument[] = [];
    const batchSize: number = 20; // magic
    const totalBatches: number = Math.ceil(dt.Rows.length / batchSize);
    console.log("Total Document Batch Started:" + totalBatches + "\r\n");
    let reccount: number = 0;
    for (let i: number = 0; i < totalBatches; i++) {
        const indexDocumentList: IndexDocument[] = [];
        console.log("Document Batch No started:" + i + "\r\n");
        const dataRows = dt.AsEnumerable().slice(i * batchSize, i * batchSize + batchSize);
        if (dataRows.length > 0) {
            reccount = dataRows.length;
            for (const dr of dataRows) {
                const objSuggest: CompletionField[] = [];
                //console.log("log start for actid:" + dr["mid"] + "\r\n");
                try {
                    const indexDocument: IndexDocument = {} as IndexDocument;
                    indexDocument.id = dr["mid"]?.toString()?.trim() || "";
                    indexDocument.mid = dr["id"]?.toString()?.trim() || "";
                    indexDocument.excusdocid = dr["excusdocid"]?.toString()?.trim() || "";
                    indexDocument.templateid = templateid;
                    indexDocument.documenttype = dr["documenttype"]?.toString()?.toLowerCase()?.trim() || "";
                    indexDocument.documentformat = dr["documentformat"]?.toString()?.toLowerCase()?.trim() || "";
                    indexDocument.filenamepath = dr["url"]?.toString()?.trim() || "";
                    indexDocument.filenamepath = Common.UploadPdfFilesOnAmazonS3Bucket(indexDocument.id, indexDocument.filenamepath);
                    //indexDocument.filenamepath = new Common().pdfFileManagement(indexDocument.id, indexDocument.filenamepath, "");
                    //Common.UploadLinkFilesOnS3(indexDocument.id, "cirnot");
                    Common.UploadLinkFilesOnS3Centax(indexDocument.mid, "cirnot", indexDocument.documentformat, dr["url"]?.toString()?.trim() || "", indexDocument.id);
                    try {
                        //Common.UploadImageOnAmazonS3Bucket(indexDocument.id, System.Configuration.ConfigurationManager.AppSettings["imagePath"]);
                        Common.UploadImageOnAmazonS3BucketCentax(indexDocument.id, indexDocument.mid);
                    } catch (ex) { Common.LogError(ex, "mid = " + dr["mid"] + "s3 upload error"); }
                    //indexDocument.categories.Add(new Category() { id = "111050000000000002", name = "Direct Tax Laws", subcategory = new Subcategory() { id = "111050000000009187", name = "Direct Tax Laws" } });
                    //indexDocument.groups = new Groups(){group= new Group() { id = "", name = "", subgroup = new Subgroup() { id = "", name = "", subsubgroup = new Subsubgroup() { id = "", name = "", subsubsubgroup = new Subsubsubgroup() { id = "", name = "", subsubsubsubgroup = new Subsubsubsubgroup() { id = "", name = "" } } } } } };
                    const year: string = dr["year"]?.toString()?.trim() || "";
                    if (!!year && year !== "0000") {
                        if (year.length > 4)
                            indexDocument.year = { id: year.substring(0, 18)?.trim() || "", name: year.substring(18, 4)?.trim() || "" };
                        else
                            indexDocument.year = { id: year?.trim() || "", name: year?.trim() || "" };
                    } else
                        indexDocument.year = { id: "", name: "" };

                    //#region cat subcat binding
                    const catSubCatArray = !!dr["categoriescentax"] ? dr["categoriescentax"].toString().split("$") : null;
                    if (catSubCatArray !== null) {
                        const objCatList: Category[] = [];
                        for (const catsubcat of catSubCatArray) {
                            if (!!catsubcat) {
                                // && catsubcat !== "111050000000000001^CORPORATE LAWS | 111050000000000007^CORPORATE LAWS"
                                const isprimarycat: number = catsubcat.split("%").length > 1 ? parseInt(catsubcat.split("%")[1]) : 0;
                                const objCat: Category = {} as Category;
                                const objSubCat: Subcategory = {} as Subcategory;
                                if (catsubcat.indexOf('|') > 0) {
                                    const catidname: string[] = !!catsubcat ? catsubcat.split('|') : null;
                                    const mainCat: string = catidname[1].trim().split('^')[0].trim();
                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objCat.id = catidname[1].trim().split('^')[0].trim();
                                            objCat.name = catidname[1].split('^')[1].trim().split('%')[0];
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.competitionCategoryId:
                                            objCat.id = Constants.competitionCategoryId;
                                            objCat.name = Constants.competitionCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.tpCategoryId:
                                            objCat.id = Constants.tpCategoryId;
                                            objCat.name = Constants.tpCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.iltCategoryId:
                                            objCat.id = Constants.iltCategoryId;
                                            objCat.name = Constants.iltCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        default:
                                            objCat.id = catidname[0].trim().split('^')[0].trim();
                                            objCat.name = catidname[0].split('^')[1].trim().split('%')[0];
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                    }

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objSubCat.id = catidname[2].trim().split('^')[0].trim();
                                            objSubCat.name = catidname[2].split('^')[1].trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.competitionCategoryId:
                                            objSubCat.id = Constants.competitionCategoryId;
                                            objSubCat.name = Constants.competitionCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.tpCategoryId:
                                            objSubCat.id = Constants.tpCategoryId;
                                            objSubCat.name = Constants.tpCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.iltCategoryId:
                                            objSubCat.id = Constants.iltCategoryId;
                                            objSubCat.name = Constants.iltCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        default:
                                            objSubCat.id = catidname[1].trim().split('^')[0].trim();
                                            objSubCat.name = catidname[1].split('^')[1].trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                    }

                                    objCat.subcategory = objSubCat;
                                } else {
                                    objCat.id = catsubcat.split('^')[0].trim();
                                    objCat.name = catsubcat.split('^')[1].trim().split('%')[0];
                                    if (objCat && objCat.name) objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                    objCat.isprimarycat = isprimarycat;

                                    objSubCat.id = "";
                                    objSubCat.name = "";
                                    objSubCat.url = "";
                                    objCat.subcategory = objSubCat;
                                }
                                objCatList.push(objCat);
                            }
                        }
                        indexDocument.categories = objCatList;
                    }
                    //#endregion

                    let documentType: string = "";

                    //#region Groups binding
                    const groupSubgroupArray = !!dr["groups"] ? dr["groups"].toString().split('|') : null;
                    if (groupSubgroupArray !== null) {
                        const objGroups: Groups = {} as Groups;
                        const objSubGroup: Subgroup = {} as Subgroup;
                        try {
                            objSubGroup.id = groupSubgroupArray[2].split('^')[0].trim();
                            objSubGroup.name = groupSubgroupArray[2].split('^')[1].trim();
                            if (objSubGroup && objSubGroup.name) objSubGroup.url = Common.GetUrl(objSubGroup.name.toLowerCase());
                        } catch (ex) {
                            // Handle exception, if required
                        }

                        objGroups.group = {
                            id: groupSubgroupArray[1].split('^')[0].trim(),
                            name: docType === 3 ? "form" : groupSubgroupArray[1].split('^')[1].trim(),
                            url: docType === 3 ? "form" : Common.GetUrl(groupSubgroupArray[1].split('^')[1].toLowerCase().trim()),
                            subgroup: objSubGroup
                        };
                        //objSubGroup.subsubgroup = [];
                        indexDocument.groups = objGroups;
                    }
                    //#endregion group binding

                    //#region heading Correction
                    let HeadingPrefix: string = "";
                    indexDocument.heading = dr["heading"]?.toString().trim() || "";
                    //if (!indexDocument.heading.toLowerCase().includes("press release")) {
                    //    indexDocument.heading = indexDocument.heading.replace(/Circular No./i, "");
                    //    indexDocument.heading = indexDocument.heading.replace(/Notification No./i, "");
                    //    if (indexDocument.groups.group.name.toLowerCase() === "circular" && !indexDocument.heading.toLowerCase().includes("circular"))
                    //        HeadingPrefix = "Circular No. ";
                    //    else if (indexDocument.groups.group.name.toLowerCase() === "notification" && !indexDocument.heading.toLowerCase().includes("notification"))
                    //        HeadingPrefix = "Notification No. ";

                    //    indexDocument.heading = HeadingPrefix + indexDocument.heading;
                    //}
                    //#endregion heading Correction End

                    const objMasters: Masterinfo = {} as Masterinfo;
                    const objMasterInfo: Info = {} as Info;
                    const objAssociates: Associates = {} as Associates;
                    //#region subject master
                    const caseSubjectArray = !!dr["CirNotSubject"] ? dr["CirNotSubject"].toString().split("$") : null;
                    const objsubjects: GenericInfo[] = [];

                    if (caseSubjectArray !== null && caseSubjectArray.length > 1) {
                        for (const association of caseSubjectArray) {
                            const associations = association.split('|');

                            if (associations !== null && associations.length > 1) {
                                const objSubject: GenericInfo = {} as GenericInfo;

                                const type: string = associations[0].trim() !== "" ? associations[1].split('^')[0].toLowerCase() : "";
                                if (type.trim() === "subject") {
                                    if (!!associations[0]) {
                                        objSubject.id = associations[0].trim();
                                        objSubject.type = type;
                                        objSubject.name = associations[1] !== "" ? associations[1].split('^')[1].split('~')[0] : "";
                                        objSubject.shortName = "";
                                        objSubject.ordering = associations[1].split('^')[1].split('~')[1];
                                        objSubject.orderInteger = 0;
                                        objSubject.url = Common.GetUrl(objSubject.name.toLowerCase());
                                        //objSubject.catUrls = categories;
                                        objsubjects.push(objSubject);
                                        if (!!objSubject.name.trim()) {
                                            objSuggest.push({
                                                Input: [objSubject.name.toLowerCase().trim()],
                                                Weight: 18
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                    //#endregion

                    //#region act associations
                    const associationArray = !!dr["ActAssociation"] ? dr["ActAssociation"].toString().split("$") : null;
                    if (associationArray != null && associationArray.length > 1) {
                        const objActs: GenericInfo[] = [];
                        const objSections: GenericInfo[] = [];
                        const objActAssociations: Associate[] = [];
                        const objSectionAssociations: Associate[] = [];

                        for (const association of associationArray) {
                            const associations = association.split("|");

                            if (associations != null && associations.length > 1) {
                                const objAct: GenericInfo = {} as GenericInfo;
                                const objSection: GenericInfo = {} as GenericInfo;
                                const objActAssociate: Associate = {} as Associate;
                                const objSectionAssociate: Associate = {} as Associate;
                                const actidsecid = associations[0].indexOf("#") !== -1 ? associations[0].trim().split("#") : null;
                                const type = associations[0] !== "" ? associations[1].split("^")[0].toLowerCase() : "";
                                if (type.toLowerCase().trim() == "act") {
                                    if (!!Common.CirnotPopularActs().get(associations[0].trim())) { // for popular acts
                                        const categories = Common.CirnotPopularActs().get(associations[0].trim())![1].split(",");
                                        objAct.id = objActAssociate.id = associations[0].trim();
                                        objAct.type = objActAssociate.type = type;
                                        objAct.name = objActAssociate.name = associations[1] !== "" ? associations[1].split("^")[1].split("~")[0] : "";
                                        objAct.shortName = "";
                                        objAct.ordering = associations[1].split("^")[1].split("~")[1];
                                        objAct.orderInteger = 0;
                                        objActAssociate.associatedDocid = "";
                                        objAct.url = objActAssociate.url = Common.GetUrl(objActAssociate.name.toLowerCase());
                                        objAct.catUrls = categories;
                                    } else { // for other acts
                                        const categories = Common.CirnotOtherActs()["999999999999999999"][1].split(",");
                                        objAct.id = "999999999999999999";
                                        objAct.type = type;
                                        objAct.name = "Other Acts";
                                        objAct.shortName = "";
                                        objAct.ordering = "999999999";
                                        objAct.orderInteger = 0;
                                        objAct.url = Common.GetUrl(objAct.name.toLowerCase());
                                        objAct.catUrls = categories;
                                        objActAssociate.id = associations[0].trim();
                                        objActAssociate.type = type;
                                        objActAssociate.name = associations[1] !== "" ? associations[1].split("^")[1].split("~")[0] : "";
                                        objActAssociate.ordering = associations[1].split("^")[1].split("~")[1];
                                        objActAssociate.associatedDocid = "";
                                        objActAssociate.url = Common.GetUrl(objActAssociate.name.toLowerCase());
                                    }
                                    // if (!!objAct.name.trim())
                                    //  objSuggest.push(objAct.name.trim());
                                    objActs.push(objAct);
                                    objActAssociations.push(objActAssociate);
                                } else {
                                    let objSByte: number;
                                    let section = associations[1] !== "" ? associations[1].split("^")[1] : "";
                                    if (!!section && Number.isInteger(parseInt(section.charAt(0)))) {
                                        section = "Section - " + section;
                                    }
                                    const parentsectioininfo = !!dr["parentsectioninfo"] ? dr["parentsectioninfo"].toString().split("$") : null;
                                    let isparentsection = false;
                                    if (parentsectioininfo != null) {
                                        for (const parentsection of parentsectioininfo) {
                                            if (parentsection.indexOf(actidsecid[1].trim()) !== -1) {
                                                const parentsectionidname = parentsection.substring(parentsection.indexOf("#")).split("|");
                                                objSectionAssociate.id = parentsectionidname[0].replace("#", " ").trim();
                                                objSectionAssociate.name = parentsectionidname[1].replace("^", "-").split("~")[0];
                                                objSectionAssociate.ordering = parentsectionidname[1].replace("^", "-").split("~")[1];
                                                objSectionAssociate.actsectionid = actidsecid[0].trim() + parentsectionidname[0].replace("#", " ").trim();
                                                isparentsection = true;
                                            }
                                        }
                                    }
                                    const sectionName = section.indexOf("~") !== -1 ? section.split("~")[0].trim() : section.trim();
                                    if (!!sectionName) {
                                        if (!!Common.CirnotPopularActs().get(actidsecid[0].trim())) { // section if popular acts
                                            objSection.id = actidsecid[1];
                                            objSection.pid = actidsecid[0];
                                            objSection.type = type;
                                            objSection.name = sectionName;
                                            objSection.shortName = "";
                                            objSection.ordering = section.indexOf("~") !== -1 ? section.split("~")[1] : "";
                                            objSection.orderInteger = 0;
                                            objSection.url = Common.GetUrl(objSection.name.toLowerCase());

                                            if (!isparentsection) {
                                                objSectionAssociate.id = actidsecid[1];
                                                objSectionAssociate.name = sectionName;
                                                objSectionAssociate.ordering = section.indexOf("~") !== -1 ? section.split("~")[1] : "";
                                                objSectionAssociate.actsectionid = actidsecid[0].trim() + actidsecid[1].trim();
                                            }
                                            objSectionAssociate.type = type;
                                            objSectionAssociate.associatedDocid = actidsecid[0];
                                            objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name.toLowerCase());

                                        } else {
                                            if (!!sectionName) {
                                                if (!isparentsection) {
                                                    objSectionAssociate.id = actidsecid[1];
                                                    objSectionAssociate.name = sectionName;
                                                    objSectionAssociate.ordering = section.indexOf("~") !== -1 ? section.split("~")[1] : "";
                                                    objSectionAssociate.actsectionid = actidsecid[0].trim() + actidsecid[1].trim();
                                                }
                                                objSectionAssociate.type = type;
                                                objSectionAssociate.associatedDocid = actidsecid[0];
                                                objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name.toLowerCase());
                                            }
                                        }

                                        // if (!!objSection.name)
                                        //  objSuggest.push(objSection.name.trim());

                                        objSections.push(objSection);
                                        objSectionAssociations.push(objSectionAssociate);
                                    }
                                }
                            }
                        }

                        // #region masterinfo Cirnot
                        const masterInfoCirnot: GenericInfo[] = [];
                        const GenericInfoCirnot: GenericInfo = {} as GenericInfo;
                        if (indexDocument.heading) GenericInfoCirnot.name = indexDocument.heading;
                        masterInfoCirnot.push(GenericInfoCirnot);
                        objMasterInfo.cirnot = masterInfoCirnot;
                        // #endregion masterinfo cirnot

                        // #region case referred associations
                        const dollarspearator = "$$";
                        const affirmreverseAssociation = !!dr["arinfo"] ? dr["arinfo"].toString().split(dollarspearator).filter((item) => item !== "") : null;
                        let counti = 0;
                        if (affirmreverseAssociation != null && affirmreverseAssociation.length > 0) {
                            const objaffirmreverseAssociations: Associate[] = [];
                            for (const association of affirmreverseAssociation) {
                                counti++;
                                const associations = association.split("^");

                                if (associations != null && associations.length > 1) {
                                    const objaffirmReverseAssociate: Associate = {} as Associate;

                                    const idtype = associations[0].indexOf("|") !== -1 ? associations[0].trim().split("|") : null;
                                    const spearator = "##";
                                    const namedate = associations[1].indexOf("##") !== -1 ? associations[1].split(spearator).filter((item) => item !== "") : null;
                                    if (idtype == null || namedate == null) {
                                        const a = "";
                                    }
                                    if (idtype != null && !!idtype[1]) {
                                        try {
                                            objaffirmReverseAssociate.id = idtype[0].trim();
                                            objaffirmReverseAssociate.type = idtype[1];
                                            objaffirmReverseAssociate.name = !!namedate ? !!namedate[0] ? namedate[0] : "" : "";
                                            const atspearator = "@@";
                                            objaffirmReverseAssociate.date = !!namedate ? namedate[1].indexOf("@@") !== -1 ? Common.converttoyymmdd(namedate[1].split(atspearator).filter((item) => item !== "")[0]) : "" : "";
                                            objaffirmReverseAssociate.subheading = !!namedate ? namedate[1].indexOf("@@") !== -1 ? namedate[1].split(atspearator).filter((item) => item !== "")[1].split("~")[0] : "" : "";
                                            objaffirmReverseAssociate.associatedDocid = !!namedate ? namedate[1].indexOf("@@") !== -1 ? namedate[1].split(atspearator).filter((item) => item !== "")[1].split("~")[1] : "" : "";
                                            objaffirmReverseAssociate.url = Common.GetUrl(objaffirmReverseAssociate.name.toLowerCase());
                                            objaffirmreverseAssociations.push(objaffirmReverseAssociate);
                                        } catch (ex) {
                                            Common.LogError(ex, "error in affirm");
                                            throw ex;
                                        }

                                    }

                                }

                            }
                            objAssociates.affirmreverse = objaffirmreverseAssociations;

                        }
                        // #endregion

                        objAssociates.act = objActAssociations;
                        objAssociates.section = objSectionAssociations;
                        objMasterInfo.act = objActs;
                        objMasterInfo.section = objSections;
                        objMasterInfo.subject = objsubjects;
                        objMasters.info = objMasterInfo;

                    }
                    // else
                    // {
                    //    indexDocument.associates = new List<Associate>() { new Associate() { id = "", type="", name = "", url="", associatedDocid="" } };
                    // }
                    // #endregion

                    //#region cirnot association
                    const cirnotAssociation = !!dr["DDA_Experts"] ? dr["DDA_Experts"].split('$') : null;
                    if (cirnotAssociation != null && cirnotAssociation.length > 1) {
                        const objcirnotAssociations: Associate[] = [];

                        for (const association of cirnotAssociation) {
                            const objcirnotAssociate: Associate = {} as Associate;
                            const associations = association.split('|');
                            if (associations != null && associations.length > 1) {
                                objcirnotAssociate.id = associations[0].trim();
                                objcirnotAssociate.type = associations[1].split('^')[0].trim().toLowerCase();
                                objcirnotAssociate.name = associations[1].split('^')[1].trim();
                                objcirnotAssociate.subheading = associations[1].split('^')[2].trim();
                                objcirnotAssociations.push(objcirnotAssociate);
                            }
                        }
                        objAssociates.expert = objcirnotAssociations;
                    }

                    indexDocument.associates = objAssociates;

                    // string heading = Convert.ToString(dr["Heading"]).Trim();
                    // if (!heading.toLowerCase().contains("circular no"))
                    //     heading = "Circular No " + heading;
                    // indexDocument.heading = heading;

                    indexDocument.subheading = dr["subheading"].toString().trim();
                    indexDocument.sortheading = dr["sortheading"].toString().toLowerCase().trim();
                    indexDocument.sortheadingnumber = dr["sortheadingnumber"].toString().toLowerCase().trim();
                    indexDocument.searchheadingnumber = Common.RemoveSpecialCharacterWithSpace(dr["searchheadingnumber"].toString().toLowerCase().trim());

                    indexDocument.url = dr["url"].toString().toLowerCase().trim();
                    indexDocument.language = dr["language"].toString().toLowerCase().trim();

                    const objStates: GenericInfo[] = [];
                    const stateinfo = !!dr["masterinfo"] ? dr["masterinfo"].split('|') : null;
                    if (stateinfo != null && dr["masterinfo"].toString().length > 5) {
                        const objState: GenericInfo = {
                            id: stateinfo[0],
                            type: stateinfo[1].split('^')[0],
                            name: stateinfo[1].split('^')[1],
                            shortName: "",
                            ordering: stateinfo[1].split('^')[1].toLowerCase(),
                            orderInteger: 0,
                            url: Common.GetUrl(stateinfo[1].split('^')[1].toLowerCase()),
                        } as GenericInfo;
                        objStates.push(objState);
                    }
                    objMasterInfo.state = objStates;

                    const objDocTypes: GenericInfo[] = [];
                    const doctypeinfo = !!documentType ? documentType.split('|') : null;
                    if (doctypeinfo != null && doctypeinfo.length > 1) {
                        const objdoctype: GenericInfo = {
                            id: doctypeinfo[0],
                            type: doctypeinfo[1],
                            name: doctypeinfo[2],
                            shortName: "",
                            ordering: doctypeinfo[2].toLowerCase(),
                            orderInteger: 0,
                            url: Common.GetUrl(doctypeinfo[2].toLowerCase()),
                        } as GenericInfo;
                        objDocTypes.push(objdoctype);
                    }
                    objMasterInfo.cirnotdoctype = objDocTypes;

                    indexDocument.masterinfo = objMasters;
                    //#endregion


                    // #region iltinfo

                    const objIltInfoes: Iltinfo[] = [];
                    const searchIltCitation: FormattedCitation[] = [];

                    if (dr.iltinfo?.indexOf('$') !== -1) {
                        const citationInfoes = dr.iltinfo?.split('$') || null;
                        if (citationInfoes !== null) {
                            for (const citationInfo of citationInfoes) {
                                const objFormattedCitation: FormattedCitation = {};
                                const objCountry1: iltinfo = {} as iltinfo;
                                const objCountry2: iltinfo = {} as iltinfo;
                                const objArticle: iltinfo = {} as iltinfo;
                                const objSubject: iltinfo = {} as iltinfo;
                                const objSubSubject: iltinfo = {} as iltinfo;
                                const cnty1cnty2artsub = citationInfo?.split('|') || null;

                                if (cnty1cnty2artsub?.[0] != null) {
                                    objCountry1.id = cnty1cnty2artsub[0]?.split('^')[0];
                                    objCountry1.name = cnty1cnty2artsub[0]?.split('^')[1];
                                    objCountry1.shortName = '';
                                    objCountry1.ordering = cnty1cnty2artsub[0]?.split('^')[1]?.toLowerCase();
                                    objCountry1.type = 'country1';
                                    objCountry1.url = Common.GetUrl(objCountry1.name);
                                }

                                if (cnty1cnty2artsub?.[1]?.length > 5) {
                                    objCountry2.id = cnty1cnty2artsub[1]?.split('^')[0];
                                    objCountry2.pid = objCountry1.id;
                                    objCountry2.name = cnty1cnty2artsub[1]?.split('^')[1];
                                    objCountry2.shortName = '';
                                    objCountry2.ordering = cnty1cnty2artsub[1]?.split('^')[1]?.toLowerCase();
                                    objCountry2.type = 'country2';
                                    objCountry2.url = Common.GetUrl(objCountry2.name);
                                } else {
                                    objCountry2.id = '000000000000000000';
                                    objCountry2.pid = objCountry1.id;
                                    objCountry2.name = '';
                                    objCountry2.shortName = '';
                                    objCountry2.ordering = '';
                                    objCountry2.type = 'country2';
                                    objCountry2.url = Common.GetUrl(objCountry2.name);
                                }

                                if (cnty1cnty2artsub?.[2]?.length > 5) {
                                    objArticle.id = cnty1cnty2artsub[2]?.split('^')[0];
                                    objArticle.name = cnty1cnty2artsub[2]?.split('^')[1];
                                    objArticle.pid = objCountry1.id + objCountry2.id;
                                    objArticle.shortName = '';
                                    objArticle.ordering = cnty1cnty2artsub[2]?.split('^')[1]?.toLowerCase();
                                    objArticle.type = 'article';
                                    objArticle.url = Common.GetUrl(objArticle.name);
                                } else {
                                    objArticle.id = '000000000000000000';
                                    objArticle.name = '';
                                    objArticle.pid = objCountry1.id + objCountry2.id;
                                    objArticle.shortName = '';
                                    objArticle.ordering = '';
                                    objArticle.type = 'article';
                                    objArticle.url = '';
                                }

                                if (cnty1cnty2artsub?.[3]?.length > 5) {
                                    objSubject.id = cnty1cnty2artsub[3]?.split('^')[0];
                                    objSubject.pid = objCountry1.id + objCountry2.id;
                                    objSubject.name = cnty1cnty2artsub[3]?.split('^')[1];
                                    objSubject.shortName = '';
                                    objSubject.ordering = cnty1cnty2artsub[3]?.split('^')[1]?.toLowerCase();
                                    objSubject.type = 'subject';
                                    objSubject.url = Common.GetUrl(objSubject.name);
                                } else {
                                    objSubject.id = '000000000000000000';
                                    objSubject.name = '';
                                    objSubject.pid = objCountry1.id + objCountry2.id;
                                    objSubject.shortName = '';
                                    objSubject.ordering = '';
                                    objSubject.type = 'subject';
                                    objSubject.url = '';
                                }

                                if (cnty1cnty2artsub?.[4]?.length > 5) {
                                    objSubSubject.id = cnty1cnty2artsub[4]?.split('^')[0];
                                    objSubSubject.pid = objSubject.id;
                                    objSubSubject.name = cnty1cnty2artsub[4]?.split('^')[1];
                                    objSubSubject.shortName = '';
                                    objSubSubject.ordering = cnty1cnty2artsub[4]?.split('^')[1]?.toLowerCase();
                                    objSubSubject.type = 'subsubject';
                                    objSubSubject.url = Common.GetUrl(objSubSubject.name);
                                } else {
                                    objSubSubject.id = '000000000000000000';
                                    objSubSubject.pid = objSubject.id;
                                    objSubSubject.name = '';
                                    objSubSubject.shortName = '';
                                    objSubSubject.ordering = '';
                                    objSubSubject.type = 'subsubject';
                                    objSubSubject.url = '';
                                }

                                searchIltCitation.push({ name: objCountry1.id + objCountry2.id + objArticle.id + objSubject.id + objSubSubject.id });

                                objIltInfoes.push({ country1: objCountry1, country2: objCountry2, article: objArticle, subject: objSubject, subsubject: objSubSubject });
                            }
                        }
                    } else {
                        const objFormattedCitation: FormattedCitation = {};
                        const objCountry1: iltinfo = {} as iltinfo;
                        const objCountry2: iltinfo = {} as iltinfo;
                        const objArticle: iltinfo = {} as iltinfo;
                        const objSubject: iltinfo = {} as iltinfo;
                        const objSubSubject: iltinfo = {} as iltinfo;
                        const cnty1cnty2artsub = dr.iltinfo?.split('|') || null;

                        if (cnty1cnty2artsub !== null) {
                            objCountry1.id = cnty1cnty2artsub[0]?.split('^')[0];
                            objCountry1.name = cnty1cnty2artsub[0]?.split('^')[1];
                            objCountry1.shortName = '';
                            objCountry1.ordering = cnty1cnty2artsub[0]?.split('^')[1]?.toLowerCase();
                            objCountry1.type = 'country1';
                            objCountry1.url = Common.GetUrl(objCountry1.name);
                        }

                        if (cnty1cnty2artsub?.[1]?.length > 5) {
                            objCountry2.id = cnty1cnty2artsub[1]?.split('^')[0];
                            objCountry2.pid = objCountry1.id;
                            objCountry2.name = cnty1cnty2artsub[1]?.split('^')[1];
                            objCountry2.shortName = '';
                            objCountry2.ordering = cnty1cnty2artsub[1]?.split('^')[1]?.toLowerCase();
                            objCountry2.type = 'country2';
                            objCountry2.url = Common.GetUrl(objCountry2.name);
                        } else {
                            objCountry2.id = '';
                            objCountry2.pid = '';
                            objCountry2.name = '';
                            objCountry2.shortName = '';
                            objCountry2.ordering = '';
                            objCountry2.type = 'country2';
                            objCountry2.url = Common.GetUrl(objCountry2.name);
                        }

                        if (cnty1cnty2artsub?.[2]?.length > 5) {
                            objArticle.id = cnty1cnty2artsub[2]?.split('^')[0];
                            objArticle.name = cnty1cnty2artsub[2]?.split('^')[1];
                            objArticle.shortName = '';
                            objArticle.ordering = cnty1cnty2artsub[2]?.split('^')[1]?.toLowerCase();
                            objArticle.type = 'article';
                            objArticle.url = Common.GetUrl(objArticle.name);
                        } else {
                            objArticle.id = '';
                            objArticle.name = '';
                            objArticle.shortName = '';
                            objArticle.ordering = '';
                            objArticle.type = 'article';
                            objArticle.url = '';
                        }

                        if (cnty1cnty2artsub?.[3]?.length > 5) {
                            objSubject.id = cnty1cnty2artsub[3]?.split('^')[0];
                            objSubject.name = cnty1cnty2artsub[3]?.split('^')[1];
                            objSubject.shortName = '';
                            objSubject.ordering = cnty1cnty2artsub[3]?.split('^')[1]?.toLowerCase();
                            objSubject.type = 'subject';
                            objSubject.url = Common.GetUrl(objSubject.name);
                        } else {
                            objSubject.id = '';
                            objSubject.name = '';
                            objSubject.shortName = '';
                            objSubject.ordering = '';
                            objSubject.type = 'subject';
                            objSubject.url = '';
                        }

                        if (cnty1cnty2artsub?.[4]?.length > 5) {
                            objSubSubject.id = cnty1cnty2artsub[4]?.split('^')[0];
                            objSubSubject.pid = objSubject.id;
                            objSubSubject.name = cnty1cnty2artsub[4]?.split('^')[1];
                            objSubSubject.shortName = '';
                            objSubSubject.ordering = cnty1cnty2artsub[4]?.split('^')[1]?.toLowerCase();
                            objSubSubject.type = 'subsubject';
                            objSubSubject.url = Common.GetUrl(objSubSubject.name);
                        } else {
                            objSubSubject.id = '';
                            objSubSubject.name = '';
                            objSubSubject.shortName = '';
                            objSubSubject.ordering = '';
                            objSubSubject.type = 'subsubject';
                            objSubSubject.url = '';
                        }

                        searchIltCitation.push({ name: objCountry1.id + objCountry2.id + objArticle.id + objSubject.id + objSubSubject.id });

                        objIltInfoes.push({ country1: objCountry1, country2: objCountry2, article: objArticle, subject: objSubject, subsubject: objSubSubject });
                    }

                    indexDocument.masterinfo = objMasters;
                    const objSearchIltCit: SearchIltCitation = { formattediltcitation: searchIltCitation };
                    indexDocument.searchiltcitation = objSearchIltCit;

                    objMasters.iltinfoes = objIltInfoes;
                    // #endregion iltinfo end

                    // #region marking info
                    const markinginfoArray = !!String(dr["MarkingInfo"]) ? String(dr["MarkingInfo"]).split('$') : null;
                    let topStoryHeading = '';
                    let topStoryDesc = '';
                    if (markinginfoArray !== null) {
                        const objMarkingInfoes: Markinginfo[] = [];
                        let num: number = 0;

                        for (const markinginfo of markinginfoArray) {
                            num++;
                            const markings = markinginfo.split('|');
                            if (markings !== null && markings.length > 1) {
                                const marking1 = markings[1].replace("&#39;", "'");
                                const markingInfo: Markinginfo = {
                                    number: num,
                                    text: markings[0].toLowerCase(),
                                    image: marking1.split('^')[0],
                                };

                                if (num === 1) {
                                    topStoryHeading = marking1.split('^')[1].split(new RegExp("##", "g"))[0];
                                    topStoryDesc = marking1.split('^')[1].indexOf("##") !== -1 ?
                                        marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[0] :
                                        marking1.split('^')[1];
                                }

                                const pmark = marking1.indexOf("@@e") !== -1 ?
                                    marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[1].split('~')[1].split('\\')[1].replace('_', ' ').trim().split(new RegExp("@@e", "g"))[1] :
                                    "";
                                const parentmark = marking1.indexOf("@@t") !== -1 ? pmark.split(new RegExp("@@t", "g")) : null;
                                markingInfo.entrydate = marking1.split('^')[1].indexOf("##") !== -1 ?
                                    marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[1].split('~')[1].split('\\')[0] :
                                    "";
                                markingInfo.updateddate = marking1.split('^')[1].indexOf("##") !== -1 ?
                                    marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[1].split('~')[1].split('\\')[1].replace('_', ' ').trim().split(new RegExp("@@e", "g"))[0] :
                                    "";

                                if (parentmark !== null) {
                                    markingInfo.parentmarking = Common.customTrimStart(parentmark[0] + ", " + parentmark[1], ',').trim().toLowerCase();
                                }

                                objMarkingInfoes.push(markingInfo);
                            }
                        }

                        indexDocument.markinginfo = objMarkingInfoes;
                    } else {
                        indexDocument.markinginfo = [{ number: 0, text: "", image: "", entrydate: new Date().toDateString(), updateddate: new Date().toDateString() }];
                    }
                    indexDocument.topstoryheading = topStoryHeading;
                    indexDocument.topstorydesc = topStoryDesc;
                    // #endregion end marking info

                    // #region Tagging Info
                    const taggingInfo = !!String(dr["TagInfo"]) ? String(dr["TagInfo"]).split('$') : null;
                    const objTags: Taginfo[] = [];
                    if (taggingInfo !== null && taggingInfo.length > 0) {
                        for (const taginfo of taggingInfo) {
                            const taginfos = !!taginfo ? taginfo.split('|') : null;
                            if (!!taginfos) {
                                const objtaginfo: Taginfo = {
                                    id: taginfos[1].split('^')[0],
                                    name: taginfos[1].split('^')[1],
                                };
                                objTags.push(objtaginfo);
                            }
                        }
                    } else {
                        const taginfos = !!String(dr["TagInfo"]) ? String(dr["TagInfo"]).split('|') : null;
                        if (taginfos !== null) {
                            const objtaginfo: Taginfo = {
                                id: taginfos[1].split('^')[0],
                                name: taginfos[1].split('^')[1],
                            };
                            objTags.push(objtaginfo);
                        }
                    }
                    indexDocument.taginfo = objTags;
                    // #endregion Tagging info end


                    // #region searchboosttext entry
                    let cirnotnum = '';
                    if (String(dr["groups"]).indexOf("111050000000000113") !== -1) {
                        indexDocument.documenttypeboost = 3000;
                        cirnotnum = "circular no " + String(dr["Heading"]).toLowerCase();
                    } else if (String(dr["groups"]).indexOf("111050000000000110") !== -1) {
                        indexDocument.documenttypeboost = 2500;
                        cirnotnum = "notification no " + String(dr["Heading"]).toLowerCase();
                    } else {
                        indexDocument.documenttypeboost = 1500;
                        cirnotnum = String(dr["Heading"]).toLowerCase();
                    }
                    indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(
                        String(dr["year"]).toLowerCase() +
                        " " +
                        Common.StringOnly(String(dr["masterinfo"])).toLowerCase() +
                        " " +
                        String(dr["documentdate"]).toLowerCase() +
                        " " +
                        String(dr["categoriescentax"]).toLowerCase() +
                        " " +
                        String(dr["groups"]).toLowerCase() +
                        " " +
                        cirnotnum +
                        " " +
                        indexDocument.subheading
                    );
                    indexDocument.shortcontent = String(dr["shortcontent"]).trim();
                    // #region footnote region
                    let fullContent = '';
                    let footnotecontent = '';
                    const doc = new DOMParser().parseFromString(String(dr["fullcontent"]), "text/html");
                    const isHtmlFootnote = doc.querySelector("div.footprint") !== null;

                    if (isHtmlFootnote && indexDocument.documentformat === ".htm") {
                        const footprintDivs = doc.querySelectorAll("div.footprint");
                        for (const item of Array.from(footprintDivs)) {
                            item.remove();
                            footnotecontent += item.outerHTML;
                        }
                        fullContent = doc.documentElement.innerHTML;
                    } else if (String(dr["fullcontent"]).indexOf("<footnote>") !== -1) {
                        const regexfootnote = /<footnote>(.*?)<\/footnote>/gs;
                        const matchesfootnote = String(dr["fullcontent"]).match(regexfootnote);
                        if (matchesfootnote !== null) {
                            footnotecontent = matchesfootnote.join("");
                        }
                        fullContent = String(dr["fullcontent"]).replace(regexfootnote, "");
                    } else {
                        fullContent = String(dr["fullcontent"]);
                    }
                    indexDocument.footnotecontent = footnotecontent;
                    // #endregion footnote

                    // #region remove header tag from full content
                    if (String(dr["fullcontent"]).indexOf("<header>") !== -1) {
                        fullContent = Common.RemovedHeaderTag(fullContent);
                    }
                    // #endregion

                    // #region xml meta tag
                    indexDocument.xmltag = String(dr["fullcontent"]).indexOf("<header>") !== -1 ? Common.GetMetaTag(String(dr["fullcontent"])) : "";
                    // #endregion

                    indexDocument.fullcontent = fullContent.trim().replace("</document>", `<div id='xmlmetadata' style='display:none;'>${indexDocument.searchboosttext}</div></document>`)
                        .replace("</html>", `<div id='htmmetadata' style='display:none;'>${indexDocument.searchboosttext}</div></html>`)
                        .concat("<div id='nodata' style='display:none;'>", indexDocument.searchboosttext, "</div>");

                    // #endregion
                    indexDocument.documentdate = String(dr["documentdate"]).split('^')[0];
                    indexDocument.formatteddocumentdate = new Date(`${indexDocument.documentdate.substring(0, 4)}-${indexDocument.documentdate.substring(4, 2)}-${indexDocument.documentdate.substring(6, 2)}`);
                    //if (!string.IsNullOrEmpty(indexDocument.heading.Trim()))
                    //{
                    //    string[] headings = indexDocument.heading.IndexOf('|') != -1 ? indexDocument.heading.Split('|') : new string[] { indexDocument.heading };
                    //    foreach (string subhead in headings)
                    //    {
                    //        if (!string.IsNullOrEmpty(subhead))
                    //            objSuggest.Add(subhead.Trim());
                    //    }
                    //}
                    indexDocument.Suggest = objSuggest;
                    indexDocument.created_date = new Date(String(dr["created_date"]).substring(0, 19).replace("T", " "));
                    const formatteddate = indexDocument.documentdate !== '' ? `${indexDocument.documentdate.substring(0, 4)}-${indexDocument.documentdate.substring(4, 2)}-${indexDocument.documentdate.substring(6, 2)}` : '1900-01-01';
                    indexDocument.updated_date = new Date(String(dr["UpdatedDate"]).substring(0, 19).replace("T", " "));
                    indexDocument.displaydocumentdatestring = indexDocument.documentdate.trim() !== '19000101' ? indexDocument.documentdate : '';

                    indexDocument.ispublished = true;
                    indexDocument.lastpublished_date = new Date();
                    indexDocument.lastQCDate = new Date();
                    indexDocument.isshowonsite = true;
                    indexDocument.boostpopularity = 1000;
                    indexDocument.viewcount = 10;

                    const filteredCategory: any = [];
                    let isGSTCategory = false;
                    if (indexDocument && indexDocument.categories)
                        for (const objCategory of indexDocument.categories) {
                            const isRequiredCategory = objCategory.id === "111050000000018392" || objCategory.id === "111050000000018393" || objCategory.id === "111050000000018400";
                            if (objCategory.name) objCategory.name = objCategory.name.replace(/centax /gi, "").replace("Centax ", "");
                            if (isRequiredCategory) {
                                filteredCategory.push(objCategory);
                            }
                            if (objCategory && objCategory.name && objCategory.name.toLowerCase() === "gst") {
                                isGSTCategory = true;
                            }
                        }
                    indexDocument.categories = filteredCategory;


                    //if (indexDocument.groups.group.name.toLowerCase() === "notification" && !isGSTCategory) {
                    //    indexDocument.heading = "Notification No. " + indexDocument.heading;
                    //}

                    indexDocumentList.push(indexDocument);
                    // console.log("log end for actid:" + dr["mid"]);
                    // WriteLog.InsertLogMsg("log end for actid:" + dr["mid"]);

                } catch (ex) {
                    console.error(ex); console.error(ex);

                    // Log additional information if needed (assuming dr["mid"] is defined)
                    console.error("mid =", dr["mid"]);

                    // You can also display a custom error message along with the mid
                    console.error("error:", dr["mid"], ex.message);

                    // Handle any specific error handling or cleanup logic if required

                    // Log the error ID (assuming Common.LogErrorId function is defined)
                    Common.LogErrorId(dr["mid"].toString());
                }
            }
            console.log("Document Batch No completed:", i);

            let status = "";
            // if (indexType === 1) {
            //     status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexName, IndexDocument, docType);
            // } else {
            //     status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexNameStopword, IndexDocument, docType);
            // }
        }
    }
    return reccount;
}

async function ArticleIndex(dt: any, docType: number, templateid: string): Promise<void> {
    const indexDocumentList: IndexDocument[] = [];
    const batchSize: number = 100; // magic
    const totalBatches: number = Math.ceil(dt.Rows.Count / batchSize);
    console.log("Total Document Batch Started:", totalBatches);

    for (let i = 0; i < totalBatches; i++) {
        indexDocumentList.length = 0;
        console.log("Document Batch No started:", i);

        const dataRows = dt.AsEnumerable().slice(i * batchSize, (i + 1) * batchSize);
        if (dataRows.length > 0) {
            for (const dr of dataRows) {
                try {
                    const objSuggest: CompletionField[] = [];
                    const indexDocument: IndexDocument = {} as IndexDocument;
                    indexDocument.id = dr["mid"].toString().trim();
                    indexDocument.mid = dr["id"].toString().trim();
                    indexDocument.excusdocid = dr["excusdocid"].toString().trim();
                    indexDocument.templateid = templateid;
                    indexDocument.documenttype = dr["documenttype"].toString().toLowerCase().trim();
                    indexDocument.documentformat = dr["documentformat"].toString().toLowerCase().trim();
                    indexDocument.documenttypeboost = 1000;
                    indexDocument.filenamepath = dr["url"].toString().trim();
                    if (dr["url"].toString().toLowerCase().indexOf(".pdf") !== -1) {
                        indexDocument.filenamepath = new Common.UploadPdfFilesOnAmazonS3Bucket(indexDocument.id, indexDocument.filenamepath);
                    }
                    // Common.UploadLinkFilesOnS3(indexDocument.id, "article");
                    Common.UploadLinkFilesOnS3Centax(indexDocument.mid, "article", indexDocument.documentformat, dr["url"].toString().trim(), indexDocument.id);
                    // indexDocument.filenamepath = new Common().pdfFileManagement(indexDocument.id, indexDocument.filenamepath, "");
                    // Common.CopyLinkFiles(indexDocument.mid, indexDocument.id, "article");
                    try {
                        // Common.UploadImageOnAmazonS3Bucket(indexDocument.id, System.Configuration.ConfigurationManager.AppSettings["imagePath"]);
                        Common.UploadImageOnAmazonS3BucketCentax(indexDocument.id, indexDocument.mid);
                    } catch (ex) {
                        Common.LogError(ex, "mid = " + dr["mid"] + "s3 upload error");
                    }
                    // indexDocument.categories.push({ id: "111050000000000002", name: "Direct Tax Laws", subcategory: { id: "111050000000009187", name: "Direct Tax Laws" } });
                    // indexDocument.groups = new Groups() { group: new Group() { id = "", name = "", subgroup: new Subgroup() { id = "", name = "", subsubgroup: new Subsubgroup() { id = "", name = "", subsubsubgroup: new Subsubsubgroup() { id = "", name = "", subsubsubsubgroup: new Subsubsubsubgroup() { id = "", name = "" } } } } } };
                    const year: string = dr["year"].toString().trim();
                    if (!!year && year !== "0000") {
                        indexDocument.year = { id: year.trim(), name: year.trim() };
                    }
                    const objMasters: Masterinfo = {} as Masterinfo;
                    const objMasterInfo: Info = {} as Info;
                    const objAssociates: Associates = {} as Associates;

                    // #region subject master
                    const caseSubjectArray = dr?.ExpertSubject?.split('$') ?? null;
                    const objsubjects: GenericInfo[] = [];

                    if (caseSubjectArray != null && caseSubjectArray.length > 1) {
                        for (const association of caseSubjectArray) {
                            const associations = association.split('|');

                            if (associations != null && associations.length > 1) {
                                const objSubject: GenericInfo = {} as GenericInfo;

                                const type = associations[0] !== "" ? associations[1]?.split('^')[0]?.toLowerCase() : "";
                                if (type === "subject") {
                                    if (!!associations[0]) {
                                        // const categories = Common.CasePopularActs()[associations[0]?.trim()]?.[1]?.split(',') ?? [];
                                        objSubject.id = associations[0]?.trim();
                                        objSubject.type = type;
                                        objSubject.name = associations[1] !== "" ? associations[1]?.split('^')[1]?.split('~')[0] : "";
                                        objSubject.shortName = "";
                                        objSubject.ordering = associations[1]?.split('^')[1]?.split('~')[1];
                                        objSubject.orderInteger = 0;
                                        objSubject.url = Common.GetUrl(objSubject.name?.toLowerCase() || "");
                                        // objSubject.catUrls = categories;
                                        objsubjects.push(objSubject);
                                        if (!!objSubject.name?.trim()) {
                                            objSuggest.push({
                                                Input: [objSubject.name.toLowerCase().trim()],
                                                Weight: 18
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // #endregion
                    // #region act associations 
                    const associationArray = dr?.actassociations?.split('$') ?? null;
                    if (associationArray != null && associationArray.length > 1) {
                        const objActs: GenericInfo[] = [];
                        const objSections: GenericInfo[] = [];
                        const objActAssociations: Associate[] = [];
                        const objSectionAssociations: Associate[] = [];

                        for (const association of associationArray) {
                            const associations = association.split('|');

                            if (associations != null && associations.length > 1) {
                                const objAct: GenericInfo = {} as GenericInfo;
                                const objSection: GenericInfo = {} as GenericInfo;
                                const objActAssociate: Associate = {} as Associate;
                                const objSectionAssociate: Associate = {} as Associate;
                                const actidsecid = associations[0]?.indexOf('#') !== -1 ? associations[0]?.trim()?.split('#') : null;
                                const type = associations[0] !== "" ? associations[1]?.split('^')[0]?.toLowerCase() : "";
                                if (type === "act") {
                                    if (!!associations[0]) {
                                        if (Common.ArticlePopularActs().hasOwnProperty(associations[0]?.trim())) {
                                            const categories = Common.ArticlePopularActs()[associations[0]?.trim()]?.[1]?.split(',') ?? [];
                                            objAct.id = objActAssociate.id = associations[0]?.trim();
                                            objAct.type = objActAssociate.type = type;
                                            objAct.name = objActAssociate.name = associations[1] !== "" ? associations[1]?.split('^')[1]?.split('~')[0] : "";
                                            objAct.shortName = "";
                                            objAct.ordering = associations[1]?.split('^')[1]?.split('~')[1];
                                            objAct.orderInteger = 0;
                                            objActAssociate.associatedDocid = "";
                                            objAct.url = objActAssociate.url = Common.GetUrl(objActAssociate.name?.toLowerCase() || "");
                                            objAct.catUrls = categories;
                                        } else {
                                            const categories = Common.ArticleOtherActs()["999999999999999999"]?.[1]?.split(',') ?? [];
                                            objAct.id = "999999999999999999";
                                            objAct.type = type;
                                            objAct.name = "Other Acts";
                                            objAct.shortName = "";
                                            objAct.ordering = "999999999";
                                            objAct.orderInteger = 0;
                                            objAct.url = Common.GetUrl(objAct.name?.toLowerCase() || "");
                                            objAct.catUrls = categories;
                                            objActAssociate.id = associations[0]?.trim();
                                            objActAssociate.type = type;
                                            objActAssociate.name = associations[1] !== "" ? associations[1]?.split('^')[1]?.split('~')[0] : "";
                                            objActAssociate.ordering = associations[1]?.split('^')[1]?.split('~')[1];
                                            objActAssociate.associatedDocid = "";
                                            objActAssociate.url = Common.GetUrl(objActAssociate.name?.toLowerCase() || "");
                                        }
                                        // if (!!objAct.name?.trim()) {
                                        //     objSuggest.push(objAct.name.trim());
                                        // }
                                        objActs.push(objAct);
                                        objActAssociations.push(objActAssociate);
                                    }
                                } else {
                                    const section = associations[1] !== "" ? associations[1]?.split('^')[1] : "";
                                    let sectionName = section?.indexOf('~') !== -1 ? section?.split('~')[0]?.trim() : section?.trim();
                                    if (!!sectionName) {
                                        const objSByte = parseInt(section?.substring(0, 1) || "");
                                        if (!isNaN(objSByte)) {
                                            sectionName = "Section - " + sectionName;
                                        }
                                        const parentsectioininfo = dr?.parentsectioninfo?.split('$') ?? null;
                                        let isparentsection = false;
                                        if (parentsectioininfo != null) {
                                            for (const parentsection of parentsectioininfo) {
                                                if (parentsection.indexOf(actidsecid?.[1]?.trim() || "") !== -1) {
                                                    const parentsectionidname = parentsection.substring(parentsection.indexOf('#')).split('|');
                                                    objSectionAssociate.id = parentsectionidname[0].replace('#', ' ').trim();
                                                    objSectionAssociate.name = parentsectionidname[1].replace('^', '-').split('~')[0];
                                                    objSectionAssociate.ordering = parentsectionidname[1].replace('^', '-').split('~')[1];
                                                    objSectionAssociate.actsectionid = (actidsecid?.[0]?.trim() || "") + parentsectionidname[0].replace('#', ' ').trim();
                                                    isparentsection = true;
                                                }
                                            }
                                        }
                                        if (Common.ArticlePopularActs().hasOwnProperty(actidsecid?.[0]?.trim() || "")) {
                                            objSection.id = actidsecid?.[1] || "";
                                            objSection.pid = actidsecid?.[0] || "";
                                            objSection.type = type;
                                            objSection.name = sectionName;
                                            objSection.shortName = "";
                                            objSection.ordering = section?.indexOf('~') !== -1 ? section?.split('~')[1] : "";
                                            objSection.orderInteger = 0;
                                            objSection.url = Common.GetUrl(objSection.name?.toLowerCase() || "");

                                            if (!isparentsection) {
                                                objSectionAssociate.id = actidsecid?.[1] || "";
                                                objSectionAssociate.name = sectionName;
                                                objSectionAssociate.ordering = section?.indexOf('~') !== -1 ? section?.split('~')[1] : "";
                                                objSectionAssociate.actsectionid = (actidsecid?.[0]?.trim() || "") + (actidsecid?.[1]?.trim() || "");
                                            }
                                            objSectionAssociate.type = type;
                                            objSectionAssociate.associatedDocid = actidsecid?.[0]?.trim() || "";
                                            objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name?.toLowerCase() || "");

                                        } else {
                                            if (!!sectionName) {
                                                if (!isparentsection) {
                                                    objSectionAssociate.id = actidsecid?.[1] || "";
                                                    objSectionAssociate.name = sectionName;
                                                    objSectionAssociate.ordering = section?.indexOf('~') !== -1 ? section?.split('~')[1] : "";
                                                    objSectionAssociate.actsectionid = (actidsecid?.[0]?.trim() || "") + (actidsecid?.[1]?.trim() || "");
                                                }
                                                objSectionAssociate.type = type;
                                                objSectionAssociate.associatedDocid = actidsecid?.[0]?.trim() || "";
                                                objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name?.toLowerCase() || "");
                                            }
                                        }

                                        // if (!!objSection.name?.trim()) {
                                        //     objSuggest.push(objSection.name.trim());
                                        // }

                                        objSections.push(objSection);
                                        objSectionAssociations.push(objSectionAssociate);
                                    }
                                }
                            }

                        }
                        objAssociates.act = objActAssociations;
                        objAssociates.section = objSectionAssociations;
                        objMasterInfo.act = objActs;
                        objMasterInfo.section = objSections;
                        objMasterInfo.subject = objsubjects;
                        objMasters.info = objMasterInfo;

                    }
                    // else {
                    //     indexDocument.associates = [{ id: "", type: "", name: "", url: "", associatedDocid: "" }];
                    // }
                    // #endregion
                    // #region article subject binding
                    const associates = !!dr["articlesubjectinfo"]
                        ? dr["articlesubjectinfo"].toString().split('^')
                        : null;

                    const objSubjectAssociations: Associate[] = [];
                    if (associates != null) {
                        const objSubjectAssociate: Associate = {} as Associate;
                        objSubjectAssociate.id = associates[0].trim();
                        objSubjectAssociate.name = associates[1].trim();
                        objSubjectAssociate.type = "subject";
                        objSubjectAssociate.url = Common.GetUrl(objSubjectAssociate.name);
                        objSubjectAssociate.associatedDocid = "";
                        objSubjectAssociations.push(objSubjectAssociate);
                    }
                    objAssociates.subject = objSubjectAssociations;
                    // #endregion article subject binding end

                    // #region rule associations
                    const ruleAssociationArray = !!dr["DDA_Rules"]
                        ? dr["DDA_Rules"].toString().split('$')
                        : null;

                    if (ruleAssociationArray != null && ruleAssociationArray.length > 1) {
                        const objRuleAssociations: Associate[] = [];
                        const objRuleNoAssociations: Associate[] = [];

                        for (const association of ruleAssociationArray) {
                            const associations = association.split('|');

                            if (!!association && association.length > 5) {
                                const objRuleAssociate: Associate = {} as Associate;
                                const objRulenoAssociate: Associate = {} as Associate;

                                const ruleidrulenoid = associations[0].toString().indexOf('#') !== -1 ? associations[0].toString().trim().split('#') : null;
                                const type = associations[0] !== "" ? associations[1].split('^')[0].toLowerCase() : "";
                                if (type.toLowerCase().trim() === "rule") {
                                    if (!!associations[0]) {
                                        objRuleAssociate.id = associations[0].trim();
                                        objRuleAssociate.type = type;
                                        objRuleAssociate.name = associations[1] !== "" ? associations[1].split('^')[1] : "";
                                        objRuleAssociate.associatedDocid = "";
                                        objRuleAssociate.url = Common.GetUrl(objRuleAssociate.name.toLowerCase());
                                        objRuleAssociations.push(objRuleAssociate);
                                    }
                                } else {
                                    const objSByte = parseInt(associations[1] !== "" ? associations[1].split('^')[1] : "");
                                    let ruleno = associations[1] !== "" ? associations[1].split('^')[1] : "";
                                    if (!isNaN(objSByte)) {
                                        ruleno = "Rule - " + ruleno;
                                    }
                                    if (!!ruleidrulenoid?.[1]) {
                                        objRulenoAssociate.id = ruleidrulenoid[1];
                                        objRulenoAssociate.type = type;
                                        objRulenoAssociate.name = ruleno;
                                        objRulenoAssociate.associatedDocid = ruleidrulenoid[0];
                                        objRulenoAssociate.url = Common.GetUrl(objRulenoAssociate.name.toLowerCase());
                                        objRuleNoAssociations.push(objRulenoAssociate);
                                    }
                                }
                            }
                        }
                        objAssociates.rule = objRuleAssociations;
                        objAssociates.ruleno = objRuleNoAssociations;
                    }
                    // #endregion

                    // #region case referred associations
                    const casereferredAssociation = !!dr["DDA_Caselaw"]
                        ? dr["DDA_Caselaw"].toString().split('$')
                        : null;

                    if (casereferredAssociation != null) {
                        const objCaseReferredAssociations: Associate[] = [];

                        for (const association of casereferredAssociation) {
                            const associations = association.split('^');

                            if (!!association && association.length > 5) {
                                const objCaseRefAssociate: Associate = {} as Associate;

                                const idtype = associations[0].toString().indexOf('|') !== -1 ? associations[0].toString().trim().split('|') : null;
                                const namedate = associations[1].toString().indexOf('#') !== -1 ? associations[1].split('#') : null;

                                if (!!idtype?.[1]) {
                                    objCaseRefAssociate.id = idtype[0];
                                    objCaseRefAssociate.type = idtype[1];
                                    objCaseRefAssociate.name = namedate?.[0] !== "" ? namedate[0] : "";
                                    objCaseRefAssociate.date = namedate?.[1]?.indexOf('@') !== -1 ? namedate[1].split('@')[0] : "";
                                    objCaseRefAssociate.subheading = namedate?.[1]?.indexOf('@') !== -1 ? namedate[1].split('@')[1] : "";
                                    objCaseRefAssociate.associatedDocid = indexDocument.mid;
                                    objCaseRefAssociate.url = Common.GetUrl(objCaseRefAssociate.name.toLowerCase());
                                    objCaseReferredAssociations.push(objCaseRefAssociate);
                                }
                            }
                        }
                        objAssociates.casereferred = objCaseReferredAssociations;
                    }

                    indexDocument.associates = objAssociates;
                    // #endregion

                    // #region cat subcat binding
                    const catSubCatArray = !!dr["categoriescentax"]
                        ? dr["categoriescentax"].toString().split('$')
                        : null;

                    if (catSubCatArray != null) {
                        const objCatList: Category[] = [];
                        for (const catsubcat of catSubCatArray) {
                            if (!!catsubcat) {
                                const isprimarycat = catsubcat.split('%').length > 1 ? parseInt(catsubcat.split('%')[1]) : 0;
                                const objCat: Category = {} as Category;
                                const objSubCat: Subcategory = {} as Subcategory;

                                if (catsubcat.indexOf('|') > 0) {
                                    const catidname = !!catsubcat ? catsubcat.split('|') : null;
                                    const mainCat = catidname[1].trim().split('^')[0].trim();
                                    const isRequiredCategory =
                                        mainCat.includes("111050000000018392") ||
                                        mainCat.includes("111050000000018393") ||
                                        mainCat.includes("111050000000018400") ||
                                        mainCat.includes("111050000000018768") ||
                                        mainCat.includes("111050000000018769") ||
                                        mainCat.includes("111050000000018770") ||
                                        mainCat.includes("111050000000018771") ||
                                        mainCat.includes("111050000000018772") ||
                                        mainCat.includes("111050000000019031");

                                    if (!isRequiredCategory) continue;

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objCat.id = catidname[1].trim().split('^')[0].trim();
                                            objCat.name = catidname[1].split('^')[1].trim().split('%')[0];
                                            if (objCat.name) objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.competitionCategoryId:
                                            objCat.id = Constants.competitionCategoryId;
                                            objCat.name = Constants.competitionCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.tpCategoryId:
                                            objCat.id = Constants.tpCategoryId;
                                            objCat.name = Constants.tpCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.iltCategoryId:
                                            objCat.id = Constants.iltCategoryId;
                                            objCat.name = Constants.iltCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        default:
                                            objCat.id = catidname[0].trim().split('^')[0].trim();
                                            objCat.name = catidname[0].split('^')[1].trim().split('%')[0];
                                            if (objCat.name) objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                    }

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objSubCat.id = catidname[2].trim().split('^')[0].trim();
                                            objSubCat.name = catidname[2].split('^')[1].trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.competitionCategoryId:
                                            objSubCat.id = Constants.competitionCategoryId;
                                            objSubCat.name = Constants.competitionCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.tpCategoryId:
                                            objSubCat.id = Constants.tpCategoryId;
                                            objSubCat.name = Constants.tpCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.iltCategoryId:
                                            objSubCat.id = Constants.iltCategoryId;
                                            objSubCat.name = Constants.iltCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        default:
                                            objSubCat.id = catidname[1].trim().split('^')[0].trim();
                                            objSubCat.name = catidname[1].split('^')[1].trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                    }

                                    objCat.subcategory = objSubCat;
                                } else {
                                    objCat.id = catsubcat.split('^')[0].trim();
                                    objCat.name = catsubcat.split('^')[1].trim().split('%')[0];
                                    if (objCat.name) objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                    objCat.isprimarycat = isprimarycat;

                                    objSubCat.id = "";
                                    objSubCat.name = "";
                                    objSubCat.url = "";
                                    objCat.subcategory = objSubCat;
                                }

                                objCatList.push(objCat);
                            }
                        }
                        indexDocument.categories = objCatList;
                    }
                    // #endregion

                    // #region group binding
                    const groupsArray = dr?.groups?.split('^').map(g => g.trim()) || null;
                    if (groupsArray) {
                        const objGroups: Groups = {
                            group: {
                                id: groupsArray[0]?.split('^')[0]?.trim() || '',
                                name: groupsArray[1]?.trim() || '',
                                url: Common.GetUrl(groupsArray[1]?.toLowerCase()?.trim()) || '',
                                subgroup: {
                                    id: '',
                                    name: '',
                                    subsubgroup: null,
                                    url: ''
                                }
                            }
                        };
                        indexDocument.groups = objGroups;
                    }
                    // #endregion end of group binding

                    indexDocument.documentdate = dr?.documentdate?.split('^')[0] || '';
                    indexDocument.formatteddocumentdate = new Date(!!indexDocument.documentdate
                        ? `${indexDocument.documentdate.substring(0, 4)}-${indexDocument.documentdate.substring(4, 6)}-${indexDocument.documentdate.substring(6, 8)}`
                        : '1900-01-01'
                    );
                    indexDocument.displaydocumentdatestring = !!indexDocument.documentdate && indexDocument.documentdate.trim() !== '19000101' ? indexDocument.documentdate : '';

                    indexDocument.heading = dr?.heading?.trim() || '';
                    indexDocument.subheading = dr?.subheading?.trim() || '';
                    indexDocument.sortheading = dr?.sortheading?.toLowerCase()?.trim() || '';
                    indexDocument.sortbycourt = '';
                    indexDocument.sortbyname = '';
                    indexDocument.sortbyauthor = dr?.sortbyauthor?.toLowerCase()?.trim() || '';
                    indexDocument.sortheadingnumber = dr?.sortheadingnumber?.toLowerCase()?.trim() || '';
                    indexDocument.searchheadingnumber = '';
                    indexDocument.parentheadings = [{ id: '', name: '', ordering: '' }];
                    indexDocument.shortcontent = dr?.shortcontent?.trim() || '';

                    indexDocument.url = dr?.url?.toLowerCase()?.trim() || '';
                    indexDocument.language = ''; // dr?.language?.toLowerCase()?.trim() || '';

                    // #region Master Info
                    const objClassifications: GenericInfo[] = [];
                    const objSubClassifications: GenericInfo[] = [];

                    const subjects = dr?.GSTSubjectID?.split('$') || null;
                    if (subjects) {
                        for (const subject of subjects) {
                            if (!!subject) {
                                const objSubjectInfo: GenericInfo = {
                                    id: subject.split('|')[0]?.trim() || '',
                                    name: subject.split('|')[1]?.trim() || '',
                                    shortName: subject.split('|')[1]?.trim() || '',
                                    ordering: '',
                                    type: 'classification',
                                    url: Common.GetUrl(subject.split('|')[1]?.trim()?.toLowerCase()) || '',
                                } as GenericInfo;
                                objClassifications.push(objSubjectInfo);
                            }
                        }
                    }

                    const asindases = dr?.AAAAssociation?.split('$') || null;
                    if (asindases) {
                        const objstandardsinfoes: GenericInfo[] = [];
                        const objsubstandardsinfoes: GenericInfo[] = [];
                        for (const asindas of asindases) {
                            if (!!asindas) {
                                const asindasinfo = asindas.split('@');
                                const groupinfo = asindasinfo[1].split('~');
                                const standardInfo = asindasinfo[0].split('|');

                                if (!!asindasinfo[0].split('|')[0]) {
                                    const objstandardinfo: GenericInfo = {
                                        id: groupinfo[0]?.trim() || '',
                                        type: 'standards',
                                        name: groupinfo[1].split('#')[0]?.trim() || '',
                                        shortName: groupinfo[1].split('#')[0]?.trim() || '',
                                        ordering: groupinfo[1].split('#')[0]?.toLowerCase() || '',
                                        url: Common.GetUrl(groupinfo[1].split('#')[0]?.trim()?.toLowerCase()) || '',
                                    } as GenericInfo;
                                    objstandardsinfoes.push(objstandardinfo);

                                    const objsubstandardinfo: GenericInfo = {
                                        id: standardInfo[0]?.trim() || '',
                                        pid: groupinfo[0]?.trim() || '',
                                        type: 'substandards',
                                        name: standardInfo[1]?.trim()?.replace('^', '-') || '',
                                        shortName: standardInfo[1]?.trim()?.replace('^', '-') || '',
                                        ordering: groupinfo[1]?.split('#')[1]?.split(':')[0] || '0',
                                        orderInteger: groupinfo[1]?.split('#')[1] ? parseInt(groupinfo[1]?.split('#')[1].split(':')[0]) : 0,
                                        year: groupinfo[1]?.split('#')[1]?.split(':')[1] || '',
                                        url: Common.GetUrl(standardInfo[1]?.trim()?.toLowerCase()?.replace('^', '-')) || '',
                                    } as GenericInfo;
                                    objsubstandardsinfoes.push(objsubstandardinfo);
                                }
                            }
                        }
                        objMasterInfo.standards = objstandardsinfoes;
                        objMasterInfo.substandards = objsubstandardsinfoes;
                    }

                    const objAuthors: GenericInfo[] = [];
                    const authornames: string[] = [];
                    const authors = dr?.AuthorName?.split('$') || null;
                    if (authors) {
                        for (const author of authors) {
                            if (!!author) {
                                const authorDetails = author.split('~');
                                const objAuthor: GenericInfo = {
                                    id: authorDetails[0]?.split('@')[0]?.trim() || '',
                                    name: authorDetails[0]?.split('@')[1] || '',
                                    shortName: '',
                                    type: 'author',
                                    designation: authorDetails[1]?.split('^')[0]?.trim() || '',
                                    socialSiteUrl: authorDetails[1]?.split('^')[1]?.split('#')[0]?.trim() || '',
                                    imagePath: authorDetails[1]?.split('^')[1]?.split('#')[1]?.trim().split('!')[0] || '',
                                    orderInteger: authorDetails[1]?.split('^')[1]?.split('#')[1]?.trim().split('!').length > 1
                                        ? parseInt(authorDetails[1]?.split('^')[1]?.split('#')[1]?.trim().split('!')[1])
                                        : 0,
                                } as GenericInfo;
                                if (!!objAuthor.imagePath) {
                                    Common.UploadAuthorsImageOnAmazonS3Bucket(indexDocument.id, objAuthor.imagePath);
                                }
                                objAuthors.push(objAuthor);
                                if (!!objAuthor.name.trim()) {
                                    authornames.push(objAuthor.name.trim());
                                }
                            }
                        }
                    }

                    objMasterInfo.authors = objAuthors;
                    objMasterInfo.classification = objClassifications;
                    objMasterInfo.subclassification = objSubClassifications;
                    objMasters.info = objMasterInfo;
                    // indexDocument.masterinfo = objMasters;
                    // #endregion



                    //#region citation

                    let objCitations: Citation[] = [];
                    let searchCitation: FormattedCitation[] = [];

                    if (dr["citation"]?.toString().indexOf('$') !== -1) {
                        const citationInfoes = !!dr["citation"] ? dr["citation"].toString().split('$') : null;
                        if (citationInfoes !== null) {
                            for (const citationInfo of citationInfoes) {
                                const objFormattedCitation: FormattedCitation = {};
                                const objYear: citationinfo = {} as citationinfo;
                                const objJournal: citationinfo = {} as citationinfo;
                                const objVolume: citationinfo = {} as citationinfo;
                                const objPage: citationinfo = {} as citationinfo;

                                const yearJournalVolumePage = !!citationInfo ? citationInfo.split('|') : null;
                                if (!!yearJournalVolumePage?.[0]) {
                                    objYear.id = yearJournalVolumePage[0];
                                    objYear.name = yearJournalVolumePage[0];
                                    objYear.shortName = yearJournalVolumePage[0];
                                    objYear.ordering = yearJournalVolumePage[0];
                                    objYear.type = "year";
                                    objYear.url = Common.GetUrl(objYear.name);
                                }

                                if (!!yearJournalVolumePage?.[1]) {
                                    const idName = yearJournalVolumePage[1].split('^');
                                    objJournal.id = idName[0];
                                    objJournal.name = idName[1];
                                    objJournal.shortName = idName[1];
                                    objJournal.ordering = idName[1].toLowerCase();
                                    objJournal.type = "journal";
                                    objJournal.url = Common.GetUrl(objJournal.name);
                                }

                                if (!!yearJournalVolumePage?.[2]) {
                                    objVolume.id = yearJournalVolumePage[2];
                                    objVolume.name = !!yearJournalVolumePage[2] ? parseInt(yearJournalVolumePage[2].trim(), 10).toString().padStart(4, '0') : Common.getRepeat("?", 4);
                                    objVolume.shortName = yearJournalVolumePage[2];
                                    objVolume.ordering = yearJournalVolumePage[2];
                                    objVolume.type = "volume";
                                    objVolume.url = Common.GetUrl(objVolume.name);
                                }

                                if (!!yearJournalVolumePage?.[3]) {
                                    objPage.id = yearJournalVolumePage[3];
                                    objPage.name = !!yearJournalVolumePage[3] ? yearJournalVolumePage[3].trim().padStart(7, '0') : Common.getRepeat("?", 7);
                                    objPage.shortName = yearJournalVolumePage[3];
                                    objPage.ordering = yearJournalVolumePage[3];
                                    objPage.type = "page";
                                    objPage.url = Common.GetUrl(objPage.name);
                                }

                                searchCitation.push({ name: objYear.name + objJournal.id + objVolume.name + objPage.name });
                                objCitations.push({ year: objYear, journal: objJournal, volume: objVolume, pageno: objPage });
                            }
                        }
                    } else {
                        const objCitation: Citation = {} as Citation;
                        const objYear: citationinfo = {} as citationinfo;
                        const objJournal: citationinfo = {} as citationinfo;
                        const objVolume: citationinfo = {} as citationinfo;
                        const objPage: citationinfo = {} as citationinfo;
                        const objFormattedCitation: FormattedCitation = {};

                        const yearJournalVolumePage = !!dr["citation"] ? dr["citation"].toString().split('|') : null;
                        if (yearJournalVolumePage !== null) {
                            if (!!yearJournalVolumePage?.[0]) {
                                objYear.id = yearJournalVolumePage[0];
                                objYear.name = yearJournalVolumePage[0];
                                objYear.shortName = yearJournalVolumePage[0];
                                objYear.ordering = yearJournalVolumePage[0];
                                objYear.type = "year";
                                objYear.url = Common.GetUrl(objYear.name);
                            }

                            if (!!yearJournalVolumePage?.[1]) {
                                const idName = yearJournalVolumePage[1].split('^');
                                objJournal.id = idName[0];
                                objJournal.name = idName[1];
                                objJournal.shortName = idName[1];
                                objJournal.ordering = idName[1].toLowerCase();
                                objJournal.type = "journal";
                                objJournal.url = Common.GetUrl(objJournal.name);
                            }

                            if (!!yearJournalVolumePage?.[2]) {
                                objVolume.id = yearJournalVolumePage[2];
                                objVolume.name = !!yearJournalVolumePage[2] ? parseInt(yearJournalVolumePage[2].trim(), 10).toString().padStart(4, '0') : Common.getRepeat("?", 4);
                                objVolume.shortName = yearJournalVolumePage[2];
                                objVolume.ordering = yearJournalVolumePage[2];
                                objVolume.type = "volume";
                                objVolume.url = Common.GetUrl(objVolume.name);
                            }

                            if (!!yearJournalVolumePage?.[3]) {
                                objPage.id = yearJournalVolumePage[3];
                                objPage.name = !!yearJournalVolumePage[3] ? yearJournalVolumePage[3].trim().padStart(7, '0') : Common.getRepeat("?", 7);
                                objPage.shortName = yearJournalVolumePage[3];
                                objPage.ordering = yearJournalVolumePage[3];
                                objPage.type = "page";
                                objPage.url = Common.GetUrl(objPage.name);
                            }

                            searchCitation.push({ name: objYear.name + objJournal.id + objVolume.name + objPage.name });
                            objCitations.push({ year: objYear, journal: objJournal, volume: objVolume, pageno: objPage });
                        }
                    }

                    objMasters.citations = objCitations;
                    indexDocument.masterinfo = objMasters;

                    const objSearchCit: SearchCitation = {} as SearchCitation;
                    objSearchCit.formattedcitation = searchCitation;
                    indexDocument.searchcitation = objSearchCit;

                    //#endregion

                    //#region OtherInfo Addition
                    const objOtherInfos: Otherinfo = {} as Otherinfo;
                    const objFullCitations: otherinfo[] = [];
                    const objSimilarFullCitations: otherinfo[] = [];

                    if (!!dr["fullcitation"]) {
                        const fullcitation: string = dr["fullcitation"].toString().trimEnd('|').replace('|', '/');
                        const objFullCitation: otherinfo = {
                            id: "",
                            name: fullcitation,
                            shortName: "",
                            type: "fullcitation",
                        };
                        if (!!objFullCitation.name && objFullCitation.name[0] === '/') {
                            objFullCitation.name = objFullCitation.name.substring(1);
                        }
                        objFullCitations.push(objFullCitation);

                        // similar full citation
                        let objSimilarFullCitation: otherinfo = {
                            id: "",
                            name: objFullCitation.name,
                            shortName: "",
                            type: "similarfullcitation",
                        };
                        objSimilarFullCitations.push(objSimilarFullCitation);

                        // original name without brackets
                        objSimilarFullCitation = {
                            id: "",
                            name: objFullCitation.name.replace(/[\[\]\(\)]/g, ''),
                            shortName: "",
                            type: "similarfullcitation",
                        };
                        objSimilarFullCitations.push(objSimilarFullCitation);

                        // original name without brackets and full stop
                        objSimilarFullCitation = {
                            id: "",
                            name: objFullCitation.name.replace(/[\[\]\(\)\.]/g, ''),
                            shortName: "",
                            type: "similarfullcitation",
                        };
                        objSimilarFullCitations.push(objSimilarFullCitation);

                        // original name without brackets and full stop replaced by space
                        objSimilarFullCitation = {
                            id: "",
                            name: objFullCitation.name.replace(/[\[\]\(\)\.]/g, ' '),
                            shortName: "",
                            type: "similarfullcitation",
                        };
                        objSimilarFullCitations.push(objSimilarFullCitation);

                        const lstStrSimilarFullCit = objFullCitation.name.split(' ');
                        const len = lstStrSimilarFullCit.length;
                        if (lstStrSimilarFullCit[len - 1].toUpperCase().includes('A') || lstStrSimilarFullCit[len - 1].toUpperCase().includes('J')) {
                            let SimilarFullCitation = '';
                            lstStrSimilarFullCit[len - 1] = lstStrSimilarFullCit[len - 1].replace(/A/gi, '').replace(/J/gi, '');
                            SimilarFullCitation = lstStrSimilarFullCit.join(' ');

                            // original name
                            objSimilarFullCitation = {
                                id: "",
                                name: SimilarFullCitation,
                                shortName: "",
                                type: "similarfullcitation",
                            };
                            objSimilarFullCitations.push(objSimilarFullCitation);

                            // original name without brackets
                            objSimilarFullCitation = {
                                id: "",
                                name: SimilarFullCitation.replace(/[\[\]\(\)]/g, ''),
                                shortName: "",
                                type: "similarfullcitation",
                            };
                            objSimilarFullCitations.push(objSimilarFullCitation);

                            // original name without brackets and full stop
                            objSimilarFullCitation = {
                                id: "",
                                name: SimilarFullCitation.replace(/[\[\]\(\)\.]/g, ''),
                                shortName: "",
                                type: "similarfullcitation",
                            };
                            objSimilarFullCitations.push(objSimilarFullCitation);

                            // original name without brackets and full stop replaced by space
                            objSimilarFullCitation = {
                                id: "",
                                name: SimilarFullCitation.replace(/[\[\]\(\)\.]/g, ' '),
                                shortName: "",
                                type: "similarfullcitation",
                            };
                            objSimilarFullCitations.push(objSimilarFullCitation);
                        }

                        const citations = !!dr["fullcitation"] ? dr["fullcitation"].toString().trimStart('|').trimEnd('|').split('|') : null;
                        if (citations !== null) {
                            const citationsA: string[] = [];
                            for (const cit of citations) {
                                if (!!cit) {
                                    citationsA.push(cit.toLowerCase().trim());
                                    const citationsubstring = cit.substring(cit.indexOf(' ')).toLowerCase().trim();
                                    if (/^\d+/.test(citationsubstring)) {
                                        citationsA.push(citationsubstring);
                                    }
                                }
                            }
                            if (citationsA.length > 0) {
                                objSuggest.push({
                                    Input: citationsA,
                                    Weight: 1,
                                });
                            }
                        }
                    }

                    objOtherInfos.fullcitation = objFullCitations;
                    objOtherInfos.similarfullcitation = objSimilarFullCitations;
                    indexDocument.otherinfo = objOtherInfos;
                    //#endregion


                    //#region iltinfo

                    // Assuming dr is of type 'Record<string, any>'
                    const objIltInfoes: Iltinfo[] = [];
                    const searchIltCitation: FormattedCitation[] = [];

                    if (!!dr["iltassociation"] && dr["iltassociation"].toString().indexOf('$') !== -1) {
                        const citationInfoes = !!dr["iltassociation"].toString() ? dr["iltassociation"].toString().split('$') : null;
                        if (citationInfoes !== null) {
                            for (const citationInfo of citationInfoes) {
                                const objFormattedCitation: FormattedCitation = {};
                                const objCountry1: iltinfo = {} as iltinfo;
                                const objCountry2: iltinfo = {} as iltinfo;
                                const objArticle: iltinfo = {} as iltinfo;
                                const objSubject: iltinfo = {} as iltinfo;
                                const objSubSubject: iltinfo = {} as iltinfo;
                                const cnty1cnty2artsub = !!citationInfo.toString() ? citationInfo.toString().split('|') : null;

                                if (cnty1cnty2artsub[0]) {
                                    objCountry1.id = cnty1cnty2artsub[0].split('^')[0];
                                    objCountry1.name = cnty1cnty2artsub[0].split('^')[1]?.indexOf('#') !== -1 ? cnty1cnty2artsub[0].split('^')[1].split('#')[0] : cnty1cnty2artsub[0].split('^')[1];
                                    objCountry1.shortName = "";
                                    objCountry1.ordering = cnty1cnty2artsub[0].split('^')[1]?.indexOf('#') !== -1 ? cnty1cnty2artsub[0].split('^')[1].split('#')[1] : cnty1cnty2artsub[0].split('^')[1];
                                    objCountry1.orderInteger = parseInt(cnty1cnty2artsub[0].split('^')[1]?.indexOf('#') !== -1 ? cnty1cnty2artsub[0].split('^')[1].split('#')[1] : "0");
                                    objCountry1.type = "country1";
                                    objCountry1.url = Common.GetUrl(objCountry1.name);
                                }

                                if (cnty1cnty2artsub[1]?.length > 5) {
                                    objCountry2.id = cnty1cnty2artsub[1].split('^')[0];
                                    objCountry2.pid = objCountry1.id;
                                    objCountry2.name = cnty1cnty2artsub[1].split('^')[1]?.indexOf('#') !== -1 ? cnty1cnty2artsub[1].split('^')[1].split('#')[0] : cnty1cnty2artsub[1].split('^')[1];
                                    objCountry2.shortName = "";
                                    objCountry2.ordering = cnty1cnty2artsub[1].split('^')[1]?.indexOf('#') !== -1 ? cnty1cnty2artsub[1].split('^')[1].split('#')[1] : cnty1cnty2artsub[1].split('^')[1];
                                    objCountry2.orderInteger = parseInt(cnty1cnty2artsub[1].split('^')[1]?.indexOf('#') !== -1 ? cnty1cnty2artsub[1].split('^')[1].split('#')[1] : "0");
                                    objCountry2.type = "country2";
                                    objCountry2.url = Common.GetUrl(objCountry2.name);
                                } else {
                                    objCountry2.id = "000000000000000000";
                                    objCountry2.pid = objCountry1.id;
                                    objCountry2.name = "";
                                    objCountry2.shortName = "";
                                    objCountry2.ordering = "";
                                    objCountry2.orderInteger = 0;
                                    objCountry2.type = "country2";
                                    objCountry2.url = Common.GetUrl(objCountry2.name);
                                }

                                if (cnty1cnty2artsub[2]?.length > 5) {
                                    objArticle.id = cnty1cnty2artsub[2].split('^')[0];
                                    objArticle.name = cnty1cnty2artsub[2].indexOf("#") !== -1 ? cnty1cnty2artsub[2].split('^')[1].split('#')[0] : cnty1cnty2artsub[2].split('^')[1];
                                    objArticle.pid = objCountry1.id + objCountry2.id;
                                    objArticle.shortName = "";
                                    objArticle.ordering = cnty1cnty2artsub[2].indexOf("#") !== -1 ? cnty1cnty2artsub[2].split('^')[1].split('#')[1] : "";
                                    objArticle.type = "article";
                                    objArticle.url = Common.GetUrl(objArticle.name);
                                } else {
                                    objArticle.id = "000000000000000000";
                                    objArticle.name = "";
                                    objArticle.pid = objCountry1.id + objCountry2.id;
                                    objArticle.shortName = "";
                                    objArticle.ordering = "";
                                    objArticle.type = "article";
                                    objArticle.url = "";
                                }

                                if (cnty1cnty2artsub[3]?.length > 5) {
                                    objSubject.id = cnty1cnty2artsub[3].split('^')[0].indexOf('-') !== -1 ? cnty1cnty2artsub[3].split('^')[0].split('-')[0] : cnty1cnty2artsub[3].split('^')[0];
                                    objSubject.pid = objCountry1.id + objCountry2.id;
                                    objSubject.pSubId = cnty1cnty2artsub[3].split('^')[0].indexOf('-') !== -1 ? cnty1cnty2artsub[3].split('^')[0].split('-')[1] : "";
                                    objSubject.name = cnty1cnty2artsub[3].split('^')[1];
                                    objSubject.shortName = "";
                                    objSubject.ordering = cnty1cnty2artsub[3].split('^')[1]?.toLowerCase();
                                    objSubject.type = "subject";
                                    objSubject.url = Common.GetUrl(objSubject.name);
                                } else {
                                    objSubject.id = "000000000000000000";
                                    objSubject.name = "";
                                    objSubject.pid = objCountry1.id + objCountry2.id;
                                    objSubject.shortName = "";
                                    objSubject.ordering = "";
                                    objSubject.type = "subject";
                                    objSubject.url = "";
                                }

                                if (cnty1cnty2artsub[4]?.length > 5) {
                                    objSubSubject.id = cnty1cnty2artsub[4].split('^')[0];
                                    objSubSubject.pid = objSubject.id;
                                    objSubSubject.name = cnty1cnty2artsub[4].indexOf("#") !== -1 ? cnty1cnty2artsub[4].split('^')[1].split('#')[0] : cnty1cnty2artsub[4].split('^')[1];
                                    objSubSubject.shortName = "";
                                    objSubSubject.ordering = cnty1cnty2artsub[4].indexOf("#") !== -1 ? cnty1cnty2artsub[4].split('^')[1].split('#')[1] : "";
                                    objSubSubject.type = "subsubject";
                                    objSubSubject.url = Common.GetUrl(objSubSubject.name);
                                } else {
                                    objSubSubject.id = "000000000000000000";
                                    objSubSubject.pid = objSubject.id;
                                    objSubSubject.name = "";
                                    objSubSubject.shortName = "";
                                    objSubSubject.ordering = "";
                                    objSubSubject.type = "subsubject";
                                    objSubSubject.url = "";
                                }

                                searchIltCitation.push({ name: objCountry1.id + objCountry2.id + objArticle.id + objSubject.id + objSubSubject.id });

                                objIltInfoes.push({
                                    country1: objCountry1,
                                    country2: objCountry2,
                                    article: objArticle,
                                    subject: objSubject,
                                    subsubject: objSubSubject,
                                });
                            }
                        }
                    } else {
                        const objFormattedCitation: FormattedCitation = {};
                        const objCountry1: iltinfo = {} as iltinfo;
                        const objCountry2: iltinfo = {} as iltinfo;
                        const objArticle: iltinfo = {} as iltinfo;
                        const objSubject: iltinfo = {} as iltinfo;
                        const objSubSubject: iltinfo = {} as iltinfo;
                        const cnty1cnty2artsub = !!dr["iltassociation"].toString() ? dr["iltassociation"].toString().split('|') : null;

                        if (cnty1cnty2artsub !== null) {
                            if (cnty1cnty2artsub[0]) {
                                objCountry1.id = cnty1cnty2artsub[0].split('^')[0];
                                objCountry1.name = cnty1cnty2artsub[0].split('^')[1]?.indexOf('#') !== -1 ? cnty1cnty2artsub[0].split('^')[1].split('#')[0] : cnty1cnty2artsub[0].split('^')[1];
                                objCountry1.shortName = "";
                                objCountry1.ordering = cnty1cnty2artsub[0].split('^')[1]?.indexOf('#') !== -1 ? cnty1cnty2artsub[0].split('^')[1].split('#')[1] : cnty1cnty2artsub[0].split('^')[1];
                                objCountry1.orderInteger = parseInt(cnty1cnty2artsub[0].split('^')[1]?.indexOf('#') !== -1 ? cnty1cnty2artsub[0].split('^')[1].split('#')[1] : "0");
                                objCountry1.type = "country1";
                                objCountry1.url = Common.GetUrl(objCountry1.name);
                            }

                            if (cnty1cnty2artsub[1]?.length > 5) {
                                objCountry2.id = cnty1cnty2artsub[1].split('^')[0];
                                objCountry2.pid = objCountry1.id;
                                objCountry2.name = cnty1cnty2artsub[1].split('^')[1]?.indexOf('#') !== -1 ? cnty1cnty2artsub[1].split('^')[1].split('#')[0] : cnty1cnty2artsub[1].split('^')[1];
                                objCountry2.shortName = "";
                                objCountry2.ordering = cnty1cnty2artsub[1].split('^')[1]?.indexOf('#') !== -1 ? cnty1cnty2artsub[1].split('^')[1].split('#')[1] : cnty1cnty2artsub[1].split('^')[1];
                                objCountry2.orderInteger = parseInt(cnty1cnty2artsub[1].split('^')[1]?.indexOf('#') !== -1 ? cnty1cnty2artsub[1].split('^')[1].split('#')[1] : "0");
                                objCountry2.type = "country2";
                                objCountry2.url = Common.GetUrl(objCountry2.name);
                            } else {
                                objCountry2.id = "";
                                objCountry2.pid = "";
                                objCountry2.name = "";
                                objCountry2.shortName = "";
                                objCountry2.ordering = "";
                                objCountry2.orderInteger = 0;
                                objCountry2.type = "country2";
                                objCountry2.url = Common.GetUrl(objCountry2.name);
                            }

                            if (cnty1cnty2artsub[2]?.length > 5) {
                                objArticle.id = cnty1cnty2artsub[2].split('^')[0];
                                objArticle.name = cnty1cnty2artsub[2].indexOf("#") !== -1 ? cnty1cnty2artsub[2].split('^')[1].split('#')[0] : cnty1cnty2artsub[2].split('^')[1];
                                objArticle.shortName = "";
                                objArticle.ordering = cnty1cnty2artsub[2].indexOf("#") !== -1 ? cnty1cnty2artsub[2].split('^')[1].split('#')[1] : "";
                                objArticle.type = "article";
                                objArticle.url = Common.GetUrl(objArticle.name);
                            } else {
                                objArticle.id = "";
                                objArticle.name = "";
                                objArticle.shortName = "";
                                objArticle.ordering = "";
                                objArticle.type = "article";
                                objArticle.url = "";
                            }

                            if (cnty1cnty2artsub[3]?.length > 5) {
                                objSubject.id = cnty1cnty2artsub[3].split('^')[0];
                                objSubject.pid = objCountry1.id + objCountry2.id;
                                objSubject.name = cnty1cnty2artsub[3].indexOf("#") !== -1 ? cnty1cnty2artsub[3].split('^')[1].split('#')[0] : cnty1cnty2artsub[3].split('^')[1];
                                objSubject.shortName = "";
                                objSubject.ordering = cnty1cnty2artsub[3].indexOf("#") !== -1 ? cnty1cnty2artsub[3].split('^')[1].split('#')[1] : "";
                                objSubject.type = "subject";
                                objSubject.url = Common.GetUrl(objSubject.name);
                            } else {
                                objSubject.id = "";
                                objSubject.name = "";
                                objSubject.shortName = "";
                                objSubject.ordering = "";
                                objSubject.type = "subject";
                                objSubject.url = "";
                            }

                            if (cnty1cnty2artsub[4]?.length > 5) {
                                objSubSubject.id = cnty1cnty2artsub[4].split('^')[0];
                                objSubSubject.pid = objSubject.id;
                                objSubSubject.name = cnty1cnty2artsub[4].indexOf("#") !== -1 ? cnty1cnty2artsub[4].split('^')[1].split('#')[0] : cnty1cnty2artsub[4].split('^')[1];
                                objSubSubject.shortName = "";
                                objSubSubject.ordering = cnty1cnty2artsub[4].indexOf("#") !== -1 ? cnty1cnty2artsub[4].split('^')[1].split('#')[1] : "";
                                objSubSubject.type = "subsubject";
                                objSubSubject.url = Common.GetUrl(objSubSubject.name);
                            } else {
                                objSubSubject.id = "";
                                objSubSubject.name = "";
                                objSubSubject.shortName = "";
                                objSubSubject.ordering = "";
                                objSubSubject.type = "subsubject";
                                objSubSubject.url = "";
                            }

                            searchIltCitation.push({ name: objCountry1.id + objCountry2.id + objArticle.id + objSubject.id + objSubSubject.id });

                            objIltInfoes.push({
                                country1: objCountry1,
                                country2: objCountry2,
                                article: objArticle,
                                subject: objSubject,
                                subsubject: objSubSubject,
                            });
                        }
                    }

                    indexDocument.masterinfo = objMasters;

                    const objSearchIltCit: SearchIltCitation = {} as SearchIltCitation;
                    objSearchIltCit.formattediltcitation = searchIltCitation;
                    indexDocument.searchiltcitation = objSearchIltCit;

                    objMasters.iltinfoes = objIltInfoes;

                    //#endregion



                    indexDocument.masterinfo = objMasters;


                    class StringBuilder {
                        private data: string[];

                        constructor() {
                            this.data = [];
                        }

                        append(text: string): void {
                            this.data.push(text);
                        }

                        toString(): string {
                            return this.data.join('');
                        }
                    }

                    const taginfoArray = !!dr["TagInfo"] ? (dr["TagInfo"] as string).split('$') : null;
                    if (taginfoArray) {
                        const objTagInfoes: Taginfo[] = [];
                        for (const taginfo of taginfoArray) {
                            const tags = taginfo.split('|');
                            if (!!tags[0]) {
                                const tagInfo: Taginfo = {
                                    id: tags[0].split('^')[0],
                                    name: tags[0].split('^')[1],
                                    validity: (!!tags[1] && tags[1] !== "0^0") ? tags[1].split('^')[0] : undefined,
                                };
                                objTagInfoes.push(tagInfo);
                            }
                        }
                        indexDocument.taginfo = objTagInfoes;
                    } else {
                        indexDocument.taginfo = [{ id: "", name: "" }];
                    }

                    const markinginfoArray = !!dr["MarkingInfo"] ? (dr["MarkingInfo"] as string).split('$') : null;
                    let topStoryHeading: string = '';
                    let topStoryDesc: string = '';
                    if (markinginfoArray) {
                        const objMarkingInfoes: Markinginfo[] = [];
                        let num: number = 0;

                        for (const markinginfo of markinginfoArray) {
                            num++;
                            const markings = markinginfo.split('|');
                            if (markings && markings.length > 1) {
                                const marking1 = markings[1].replace("&#39;", "'");
                                const markingInfo: Markinginfo = {
                                    number: num,
                                    text: markings[0].toLowerCase(),
                                    image: marking1.split('^')[0],
                                };
                                if (num === 1) {
                                    topStoryHeading = marking1.split('^')[1].split(new RegExp("##", "g"))[0];
                                    topStoryDesc = marking1.split('^')[1].indexOf("##") !== -1 ? marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[0] : marking1.split('^')[1];
                                }
                                const pmark = marking1.indexOf("@@e") !== -1 ? marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[1].split('~')[1].split('\\')[1].replace('_', ' ').trim().split(new RegExp("@@e", "g"))[1] : "";
                                const parentmark = marking1.indexOf("@@t") !== -1 ? pmark.split(new RegExp("@@t", "g")) : null;
                                markingInfo.entrydate = marking1.split('^')[1].indexOf("##") !== -1 ? marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[1].split('~')[1].split('\\')[0] : "";
                                markingInfo.updateddate = marking1.split('^')[1].indexOf("##") !== -1 ? marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[1].split('~')[1].split('\\')[1].replace('_', ' ').trim().split(new RegExp("@@e", "g"))[0] : "";
                                if (parentmark) {
                                    markingInfo.parentmarking = Common.customTrimStart((parentmark[0] + ", " + parentmark[1]), ',').trim().toLowerCase();
                                }
                                objMarkingInfoes.push(markingInfo);
                            }
                        }

                        indexDocument.markinginfo = objMarkingInfoes;
                    } else {
                        indexDocument.markinginfo = [{ number: 0, text: "", image: "", entrydate: new Date().toLocaleDateString(), updateddate: new Date().toLocaleDateString() }];
                    }
                    indexDocument.topstoryheading = topStoryHeading;
                    indexDocument.topstorydesc = topStoryDesc;

                    indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(`${dr["categoriescentax"]?.toString().toLowerCase()} ${dr["groups"]?.toString().toLowerCase()} ${dr["year"]?.toString().toLowerCase()} ${dr["fullcitation"]?.toString().toLowerCase()} ${Common.StringOnly(dr["actassociations"])?.toString().toLowerCase()} ${Common.StringOnly(dr["articlesubjectinfo"])?.toString().toLowerCase()} ${dr["heading"]?.toString().trim()} ${dr["subheading"]?.toString().trim()} ${authornames.join(" ")}`);

                    indexDocument.shortcontent = dr["shortcontent"]?.toString().trim();
                    //#region footnote
                    const doc = new DOMParser().parseFromString(dr["fullcontent"], "text/html");
                    const isHtmlFootnote = !!doc.querySelectorAll(".footprint").length;
                    let fullContent: string = "";
                    const footnotecontent = new StringBuilder();

                    if (isHtmlFootnote && indexDocument.documentformat === ".htm") {
                        doc.querySelectorAll(".footprint").forEach(item => {
                            item.remove();
                            footnotecontent.append(item.outerHTML);
                        });
                        fullContent = doc.body.innerHTML;
                    } else if (dr["fullcontent"].indexOf("<footnote>") !== -1) {
                        const regexfootnote = "<footnote>(.*?)</footnote>";
                        const replaceValue = "";
                        const matchesfootnote = (dr["fullcontent"] as string).match(new RegExp(regexfootnote, "gs"));
                        if (matchesfootnote) {
                            matchesfootnote.forEach(matchfoot => {
                                footnotecontent.append(matchfoot);
                            });
                        }
                        fullContent = (dr["fullcontent"] as string).replace(new RegExp(regexfootnote, "gs"), "");
                    } else {
                        fullContent = dr["fullcontent"]?.toString();
                    }
                    indexDocument.footnotecontent = footnotecontent.toString();
                    //#endregion footnote


                    // ... (existing code)

                    // Remove header tag from full content
                    if (!!indexDocument && !!indexDocument.fullcontent && indexDocument.fullcontent.indexOf("<header>") !== -1) {
                        fullContent = Common.RemovedHeaderTag(fullContent);
                    }

                    // Get XML meta tag from full content
                    if (!!indexDocument && !!indexDocument.fullcontent && indexDocument.fullcontent.indexOf("<header>") !== -1) {
                        indexDocument.xmltag = Common.GetMetaTag(indexDocument.fullcontent);
                    } else {
                        indexDocument.xmltag = "";
                    }

                    // Trim and modify the full content
                    indexDocument.fullcontent = fullContent.trim().lastIndexOf("</document>") !== -1
                        ? fullContent.trim().replace("</document>", "<div id='xmlmetadata' style='display:none;'>" + indexDocument.searchboosttext + "</div></document>")
                        : fullContent.lastIndexOf("</html>") !== -1
                            ? fullContent.trim().replace("</html>", "<div id='htmmetadata' style='display:none;'>" + indexDocument.searchboosttext + "</div></html>")
                            : fullContent.trim() + "<div id='nodata' style='display:none;'>" + indexDocument.searchboosttext + "</div>";

                    indexDocument.Suggest = objSuggest;
                    indexDocument.created_date = new Date(dr["created_date"].toString().substr(0, 4) + "-" + dr["created_date"].toString().substr(4, 2) + "-" + dr["created_date"].toString().substr(6, 2) + " " + dr["created_date"].toString().substr(8, 2) + ":" + dr["created_date"].toString().substr(10, 2) + ":" + dr["created_date"].toString().substr(12, 2) || "1900-01-01");
                    const formatteddate = indexDocument.documentdate ? indexDocument.documentdate.substring(0, 4) + "-" + indexDocument.documentdate.substring(4, 6) + "-" + indexDocument.documentdate.substring(6, 8) : "1900-01-01";

                    indexDocument.updated_date = new Date(dr["UpdatedDate"].toString().substr(0, 4) + "-" + dr["UpdatedDate"].toString().substr(4, 2) + "-" + dr["UpdatedDate"].toString().substr(6, 2) || "1900-01-01");
                    indexDocument.ispublished = true;
                    indexDocument.lastpublished_date = new Date();
                    indexDocument.lastQCDate = new Date();
                    indexDocument.isshowonsite = true;
                    indexDocument.boostpopularity = 1000;
                    indexDocument.viewcount = 10;

                    // Filter and modify categories
                    const filteredCategory: Category[] = [];
                    if (!!indexDocument.categories)
                        for (const objCategory of indexDocument.categories) {
                            const isRequiredCategory = objCategory.id === "111050000000018392" || objCategory.id === "111050000000018393" || objCategory.id === "111050000000018400";
                            if (!!objCategory.name) objCategory.name = objCategory.name.replace(/centax /gi, "");
                            if (!!objCategory.name) objCategory.name = objCategory.name.replace("Centax ", "");
                            if (isRequiredCategory) {
                                filteredCategory.push(objCategory);
                            }
                        }
                    indexDocument.categories = filteredCategory;

                    indexDocumentList.push(indexDocument);


                    // ... (the rest of the code)
                } catch (ex) {
                    Common.LogError(ex, " MID = " + dr["mid"]);
                    console.log("error: " + dr["mid"] + ex.message);
                    Common.LogErrorId(dr["mid"].toString());

                }
            }
            console.log("Document Batch No completed: " + i + "\r\n");
            let status: string = "";
            // if (indexType === 1)
            //     status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexName, IndexDocument, docType);
            // else
            //     status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexNameStopword, IndexDocument, docType);
            // GC.Collect();

        }
    }
}

async function TreatyIndex(dt: any, docType: number, templateid: string) {
    let indexDocumentList: IndexDocument[] = [];
    const batchSize: number = 1000; // magic
    const totalBatches: number = Math.ceil(dt.Rows.Count / batchSize);
    console.log("Total Document Batch Started:" + totalBatches + "\r\n");

    for (let i = 0; i < totalBatches; i++) {
        console.log("Document Batch No started:" + i + "\r\n");
        const dataRows = dt.AsEnumerable()?.slice(i * batchSize, (i + 1) * batchSize);
        if (dataRows?.length > 0) {
            for (const dr of dataRows) {
                let objSuggest: CompletionField[] = [];
                // console.log("log start for actid:" + dr["mid"] + "\r\n");
                try {
                    let indexDocument: IndexDocument = {} as IndexDocument;
                    indexDocument.id = dr["mid"]?.toString().trim() ?? "";
                    indexDocument.mid = dr["id"]?.toString().trim() ?? "";
                    indexDocument.templateid = templateid;
                    indexDocument.documenttype = dr["documenttype"]?.toString().toLowerCase().trim() ?? "";
                    indexDocument.documentformat = dr["documentformat"]?.toString().toLowerCase().trim() ?? "";
                    indexDocument.filenamepath = dr["url"]?.toString().trim() ?? "";

                    if (dr["url"]?.toString().toLowerCase().includes(".pdf")) {
                        indexDocument.filenamepath = this.UploadPdfFilesOnAmazonS3Bucket(indexDocument.id, indexDocument.filenamepath);
                    }

                    try {
                        this.UploadImageOnAmazonS3BucketCentax(indexDocument.id, indexDocument.mid);
                    } catch (ex) {
                        this.LogError(ex, " s3 upload error");
                    }

                    this.UploadLinkFilesOnS3Centax(indexDocument.mid, "treaty", indexDocument.documentformat, dr["url"]?.toString().trim() ?? "", indexDocument.id);

                    let year: string = dr["groups"]?.toString().substring(dr["groups"]?.toString().lastIndexOf('^') + 1).split('#')[0] ?? "";

                    if (!!year && year.length < 6) {
                        indexDocument.year = { id: year.replace('|', ' ').trim(), name: year.replace('|', ' ').trim() };
                    } else {
                        indexDocument.year = { id: "", name: "" };
                    }

                    let objMasters: Masterinfo = {} as Masterinfo;
                    let objMasterInfo: Info = {} as Info;
                    //#region cat subcat binding
                    const catSubCatArray = !!dr["categoriescentax"]
                        ? dr["categoriescentax"].toString().split('$')
                        : null;

                    if (catSubCatArray !== null) {
                        const objCatList: Category[] = [];

                        for (const catsubcat of catSubCatArray) {
                            if (!!catsubcat) {
                                const objCat: Category = {} as Category;
                                const objSubCat: Subcategory = {} as Subcategory;

                                const isprimarycat: number =
                                    catsubcat.split('%').length > 1 ? parseInt(catsubcat.split('%')[1]) : 0;

                                if (catsubcat.indexOf('|') > 0) {
                                    const catidname = catsubcat.split('|');
                                    const mainCat = catidname[1].trim().split('^')[0].trim();

                                    const isRequiredCategory =
                                        mainCat.includes("111050000000018392") ||
                                        mainCat.includes("111050000000018393") ||
                                        mainCat.includes("111050000000018400") ||
                                        mainCat.includes("111050000000018768") ||
                                        mainCat.includes("111050000000018769") ||
                                        mainCat.includes("111050000000018770") ||
                                        mainCat.includes("111050000000018771") ||
                                        mainCat.includes("111050000000018772") ||
                                        mainCat.includes("111050000000019031");

                                    if (!isRequiredCategory) {
                                        continue;
                                    }

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objCat.id = catidname[1].trim().split('^')[0].trim();
                                            objCat.name = catidname[1].split('^')[1].trim().split('%')[0];
                                            if (objCat.name) objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.competitionCategoryId:
                                            objCat.id = Constants.competitionCategoryId;
                                            objCat.name = Constants.competitionCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.tpCategoryId:
                                            objCat.id = Constants.tpCategoryId;
                                            objCat.name = Constants.tpCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.iltCategoryId:
                                            objCat.id = Constants.iltCategoryId;
                                            objCat.name = Constants.iltCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        default:
                                            objCat.id = catidname[0].trim().split('^')[0].trim();
                                            objCat.name = catidname[0].split('^')[1].trim().split('%')[0];
                                            if (objCat.name) objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                    }

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objSubCat.id = catidname[2].trim().split('^')[0].trim();
                                            objSubCat.name = catidname[2].split('^')[1].trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.competitionCategoryId:
                                            objSubCat.id = Constants.competitionCategoryId;
                                            objSubCat.name = Constants.competitionCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.tpCategoryId:
                                            objSubCat.id = Constants.tpCategoryId;
                                            objSubCat.name = Constants.tpCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.iltCategoryId:
                                            objSubCat.id = Constants.iltCategoryId;
                                            objSubCat.name = Constants.iltCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        default:
                                            objSubCat.id = catidname[1].trim().split('^')[0].trim();
                                            objSubCat.name = catidname[1].split('^')[1].trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                    }

                                    objCat.subcategory = objSubCat;
                                } else {
                                    objCat.id = catsubcat.split('^')[0].trim();
                                    objCat.name = catsubcat.split('^')[1].trim().split('%')[0];
                                    if (objCat.name) objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                    objCat.isprimarycat = isprimarycat;

                                    objSubCat.id = "";
                                    objSubCat.name = "";
                                    objSubCat.url = "";
                                    objCat.subcategory = objSubCat;
                                }

                                objCatList.push(objCat);
                            }
                        }

                        indexDocument.categories = objCatList;
                    }
                    //#endregion

                    //#region Groups binding
                    var groupSubgroupArray = !!dr["groups"] ? (dr["groups"] as string).split('|') : null;

                    if (groupSubgroupArray != null) {
                        const objGroups: any = {};
                        const objSubGroup: any = {};
                        if (groupSubgroupArray[1]?.indexOf('^') !== -1) {
                            objSubGroup.id = groupSubgroupArray[1].split('^')[0].trim();
                            objSubGroup.name = groupSubgroupArray[1].split('^')[1]?.indexOf('#') !== -1 ? groupSubgroupArray[1].split('^')[1].split('#')[0].trim() : groupSubgroupArray[1].split('^')[1].trim();
                            objSubGroup.ordering = groupSubgroupArray[1].split('^')[1]?.indexOf('#') !== -1 ? groupSubgroupArray[1].split('^')[1].split('#')[1].trim() : "0";

                            objSubGroup.url = Common.GetUrl(objSubGroup.name.toLowerCase());
                        }
                        const objSubSubGroup: any = {};
                        if (groupSubgroupArray.length > 2 && groupSubgroupArray[2] != null && !!groupSubgroupArray[2]) {
                            objSubSubGroup.id = groupSubgroupArray[2].split('^')[0].trim();
                            if (objSubSubGroup.id === "111050000000011236")
                                objSubSubGroup.name = "Repealed or Old Treaties";
                            else if (objSubSubGroup.id === "111050000000011126")
                                objSubSubGroup.name = "Country Treaties";
                            else
                                objSubSubGroup.name = groupSubgroupArray[2].split('^')[1]?.indexOf('#') !== -1 ? groupSubgroupArray[2].split('^')[1].split('#')[0].trim() : groupSubgroupArray[2].split('^')[1].trim();
                            objSubSubGroup.ordering = groupSubgroupArray[2].split('^')[1]?.indexOf('#') !== -1 ? groupSubgroupArray[2].split('^')[1].split('#')[1].trim() : "0";
                            objSubSubGroup.url = Common.GetUrl(objSubSubGroup.name.toLowerCase());
                        }
                        const objSubSubSubGroup: any = {};
                        if (groupSubgroupArray.length > 3 && groupSubgroupArray[3] != null && !!groupSubgroupArray[3]) {
                            objSubSubSubGroup.id = groupSubgroupArray[3].split('^')[0].trim();
                            objSubSubSubGroup.name = groupSubgroupArray[3].split('^')[1]?.indexOf('#') !== -1 ? groupSubgroupArray[3].split('^')[1].split('#')[0].trim() : groupSubgroupArray[3].split('^')[1].trim();
                            objSubSubSubGroup.ordering = groupSubgroupArray[3].split('^')[1]?.indexOf('#') !== -1 ? groupSubgroupArray[3].split('^')[1].split('#')[1].trim() : "0";

                            objSubSubSubGroup.url = Common.GetUrl(objSubSubSubGroup.name.toLowerCase());
                        }
                        objSubSubGroup.subsubsubgroup = objSubSubSubGroup;
                        objSubGroup.subsubgroup = objSubSubGroup;
                        objGroups.group = { id: groupSubgroupArray[0].split('^')[0].trim(), name: groupSubgroupArray[0].split('^')[1]?.indexOf('#') !== -1 ? groupSubgroupArray[0].split('^')[1].split('#')[0].trim() : groupSubgroupArray[0].split('^')[1].trim(), ordering: groupSubgroupArray[0].split('^')[1]?.indexOf('#') !== -1 ? groupSubgroupArray[0].split('^')[1].split('#')[1].trim() : "0", url: Common.GetUrl(groupSubgroupArray[0].split('^')[1]?.indexOf('#') !== -1 ? groupSubgroupArray[0].split('^')[1].split('#')[0].trim() : groupSubgroupArray[0].split('^')[1].trim()), subgroup: objSubGroup };
                        //objSubGroup.subsubgroup =[];
                        indexDocument.groups = objGroups;
                    }
                    //#endregion

                    const hasFile = !!dr["Hasfile"] && (dr["Hasfile"] as string).toLowerCase().indexOf("yes") !== -1 ? "yes" : "no";
                    var parents = !!dr["ParentHeading"] ? (dr["ParentHeading"] as string).split('$') : null;
                    if (parents != null && parents[0].length > 15) {
                        indexDocument.parentheadings = [{ id: parents[0].trim(), name: (dr["ShortName"] as string).trim(), ordering: (dr["ShortName"] as string).toLowerCase().trim(), hasfile: "yes" }];
                    } else {
                        indexDocument.parentheadings = [{ id: "000000000000000000", name: "", ordering: "", hasfile: hasFile }];
                    }
                    const associates = !!dr["associates"] ? (dr["associates"] as string).split('^') : null;
                    const objAssociates: any = {};
                    const objSubjectAssociations: any[] = [];
                    if (associates != null) {
                        const objSubjectAssociate: any = {};
                        objSubjectAssociate.id = associates[0].trim();
                        objSubjectAssociate.name = associates[1].trim()?.indexOf('#') !== -1 ? associates[1].split('#')[0] : associates[1].trim();
                        objSubjectAssociate.type = "subject";
                        objSubjectAssociate.ordering = associates[1].trim()?.indexOf('#') !== -1 ? associates[1].split('#')[1] : "";
                        objSubjectAssociate.url = Common.GetUrl(objSubjectAssociate.name);
                        objSubjectAssociate.associatedDocid = "";
                        objSubjectAssociations.push(objSubjectAssociate);
                    }
                    objAssociates.subject = objSubjectAssociations;
                    indexDocument.associates = objAssociates;

                    indexDocument.documentdate = !!dr["documentdate"]?.toString().split('^')[0] ? dr["documentdate"].toString().split('^')[0] : "19000101";
                    indexDocument.formatteddocumentdate = new Date(!!indexDocument.documentdate ? indexDocument.documentdate.substring(0, 4) + "-" + indexDocument.documentdate.substring(4, 2) + "-" + indexDocument.documentdate.substring(6, 2) : "1900-01-01");
                    const headings = !!dr["heading"] ? (dr["heading"] as string).split('|') : null;
                    if (headings != null) {
                        if (headings.length === 2 && !!headings[1]?.trim())
                            indexDocument.heading = (headings[0] + "|" + headings[1]).trim();
                        else
                            indexDocument.heading = headings[0].trim();
                    }

                    indexDocument.subheading = (dr["subheading"] as string)?.trim();

                    if (docType == 8) {
                        if (dr["groups"].toString().indexOf("111050000000011236^Old Treaties") !== -1)
                            indexDocument.sortheadingnumber = "40" + (dr["sortheadingnumber"] as string).toLowerCase().trim();
                        else if (dr["groups"].toString().indexOf("111050000000011127^Model Treaties") !== -1) {
                            if (indexDocument.id === "108690000000000523" || indexDocument.id === "108690000000000488" || indexDocument.id === "108690000000000524" || indexDocument.id === "108690000000000065" || indexDocument.id === "108690000000000066")
                                indexDocument.sortheadingnumber = "10" + (dr["sortheadingnumber"] as string).toLowerCase().trim();
                            else
                                indexDocument.sortheadingnumber = "30" + (dr["sortheadingnumber"] as string).toLowerCase().trim();
                        } else if (dr["groups"].toString().indexOf("111050000000011126^Treaties") !== -1) {
                            indexDocument.sortheadingnumber = "20" + (dr["sortheadingnumber"] as string).toLowerCase().trim();
                        } else {
                            indexDocument.sortheadingnumber = (dr["sortheadingnumber"] as string).toLowerCase().trim();
                        }
                    } else
                        indexDocument.sortheadingnumber = (dr["sortheadingnumber"] as string).toLowerCase().trim();
                    indexDocument.searchheadingnumber = (dr["searchheadingnumber"] as string).toLowerCase().trim();
                    indexDocument.documenttypeboost = 2000;
                    indexDocument.url = (dr["url"] as string).toLowerCase().trim();
                    indexDocument.language = ""; // Convert.ToString(dr["language"]).toLowerCase().trim();

                    //#region Master Info

                    objMasters.info = objMasterInfo;
                    // indexDocument.masterinfo = objMasters;

                    //#endregion

                    //#region iltinfo

                    //#region citation
                    const objIltInfoes: Iltinfo[] = [];
                    const countries: string[] = [];
                    const articles: string[] = [];
                    const subjects: string[] = [];
                    const searchIltCitation: FormattedCitation[] = [];
                    const yr = indexDocument.year?.id ?? "0000";
                    if (dr?.["iltassociation"]?.toString()?.indexOf('$') !== -1) {
                        const citationInfoes: string[] | null = !!dr["iltassociation"] ? dr["iltassociation"].toString().split('$') : null;

                        if (citationInfoes !== null) {
                            for (const citationInfo of citationInfoes) {
                                const objFormattedCitation: FormattedCitation = {};
                                const objCountry1: iltinfo = {};
                                const objCountry2: iltinfo = {};
                                const objArticle: iltinfo = {};
                                const objSubject: iltinfo = {};
                                const objSubSubject: iltinfo = {};
                                const objFlag1: iltinfo = {};
                                const objFlag2: iltinfo = {};
                                const cnty1cnty2artsub: string[] | null = !!citationInfo ? citationInfo.split('|') : null;
                                if (cnty1cnty2artsub && cnty1cnty2artsub?.[0] !== null) {
                                    objCountry1.id = cnty1cnty2artsub[0].split('^')[0];
                                    objCountry1.name = cnty1cnty2artsub[0].split('^')[1];
                                    objCountry1.shortName = "";
                                    objCountry1.ordering = cnty1cnty2artsub[0].split('^')[1]?.toLowerCase() ?? "";
                                    objCountry1.type = "country1";
                                    objCountry1.url = Common.GetUrl(objCountry1.name);
                                    if (!!objCountry1.name?.trim()) countries.push(objCountry1.name.toLowerCase().trim());
                                }
                                if (cnty1cnty2artsub && cnty1cnty2artsub?.[1] !== null) {
                                    if (cnty1cnty2artsub[1].length > 5 && cnty1cnty2artsub[1].split('^')[0] !== "000000000000000000") {
                                        objCountry2.id = cnty1cnty2artsub[1].split('^')[0];
                                        objCountry2.pid = objCountry1.id;
                                        objCountry2.name = cnty1cnty2artsub[1].split('^')[1];
                                        objCountry2.shortName = "";
                                        objCountry2.ordering = cnty1cnty2artsub[1].split('^')[1]?.toLowerCase() ?? "";
                                        objCountry2.type = "country2";
                                        objCountry2.url = Common.GetUrl(objCountry2.name);
                                        if (!!objCountry2.name?.trim()) countries.push(objCountry2.name.toLowerCase().trim());
                                    }
                                }
                                if (cnty1cnty2artsub && cnty1cnty2artsub?.length > 2 && cnty1cnty2artsub[2] !== null) {
                                    if (cnty1cnty2artsub[2].length > 5) {
                                        objArticle.id = cnty1cnty2artsub[2].split('^')[0];
                                        objArticle.name = cnty1cnty2artsub[2].split('^')[1].split('#')[0];
                                        if (objCountry1.id) objArticle.pid = objCountry1.id + objCountry2.id;
                                        objArticle.shortName = "";
                                        objArticle.ordering = cnty1cnty2artsub[2].split('^')[1].split('#')[1];
                                        objArticle.type = "article";
                                        objArticle.url = Common.GetUrl(objArticle.name);
                                        if (!!objArticle.name?.trim()) articles.push(objArticle.name.toLowerCase().trim());
                                    }
                                }
                                if (cnty1cnty2artsub && cnty1cnty2artsub?.length > 3 && cnty1cnty2artsub[3] !== null) {
                                    if (cnty1cnty2artsub[3].length > 5) {
                                        objSubject.id = cnty1cnty2artsub[3].split('^')[0];
                                        if (objCountry1.id) objSubject.pid = objCountry1.id + objCountry2.id;
                                        objSubject.name = cnty1cnty2artsub[3].split('^')[1];
                                        objSubject.shortName = "";
                                        objSubject.ordering = cnty1cnty2artsub[3].split('^')[1]?.toLowerCase() ?? "";
                                        objSubject.type = "subject";
                                        objSubject.url = Common.GetUrl(objSubject.name);
                                        if (!!objSubject.name?.trim()) subjects.push(objSubject.name.toLowerCase().trim());
                                    }
                                }
                                if (cnty1cnty2artsub && cnty1cnty2artsub?.length > 4 && cnty1cnty2artsub[4] !== null) {
                                    if (cnty1cnty2artsub[4].length > 5) {
                                        objSubSubject.id = cnty1cnty2artsub[4].split('^')[0];
                                        objSubSubject.pid = objSubject.id;
                                        objSubSubject.name = cnty1cnty2artsub[4].split('^')[1];
                                        objSubSubject.shortName = "";
                                        objSubSubject.ordering = cnty1cnty2artsub[4].split('^')[1]?.toLowerCase() ?? "";
                                        objSubSubject.type = "subsubject";
                                        objSubSubject.url = Common.GetUrl(objSubSubject.name);
                                        if (!!objSubSubject.name?.trim()) subjects.push(objSubSubject.name.toLowerCase().trim());
                                    }
                                }
                                const flags = !!dr["flaginfo"] ? dr["flaginfo"].toString().split('|') : null;
                                if (flags !== null && flags.length === 2) {
                                    objFlag1.id = flags[0].trim();
                                    objFlag1.name = flags[0].toUpperCase().trim().replace("'", "");
                                    objFlag1.ordering = flags[0].toLowerCase().trim().replace("'", "");
                                    objFlag1.url = flags[0].toLowerCase().trim().replace("'", "");
                                    objFlag1.orderInteger = 0;
                                    objFlag2.id = flags[1].trim();
                                    objFlag2.name = flags[1].toUpperCase().trim().replace("'", "");
                                    objFlag2.ordering = flags[1].toLowerCase().trim().replace("'", "");
                                    objFlag2.url = flags[1].toLowerCase().trim().replace("'", "");
                                    objFlag2.orderInteger = 0;
                                }
                                const cnty2Id = objCountry2.id ?? "000000000000000000";
                                const artId = objArticle.id ?? "000000000000000000";
                                const subId = objSubject.id ?? "000000000000000000";
                                const subSubId = objSubSubject.id ?? "000000000000000000";
                                searchIltCitation.push({ name: objCountry1.id + cnty2Id + artId + subId + subSubId + yr });

                                objIltInfoes.push({ country1: objCountry1, country2: objCountry2, article: objArticle, subject: objSubject, subsubject: objSubSubject, flag1: objFlag1, flag2: objFlag2 });
                            }
                        }
                    } else {
                        const objFormattedCitation: FormattedCitation = {};
                        const objCountry1: iltinfo = {};
                        const objCountry2: iltinfo = {};
                        const objArticle: iltinfo = {};
                        const objSubject: iltinfo = {};
                        const objSubSubject: iltinfo = {};
                        const objFlag1: iltinfo = {};
                        const objFlag2: iltinfo = {};
                        const cnty1cnty2artsub: string[] | null = !!dr?.["iltassociation"] ? dr["iltassociation"].toString().split('|') : null;
                        if (cnty1cnty2artsub !== null) {
                            if (cnty1cnty2artsub?.[0] !== null) {
                                objCountry1.id = cnty1cnty2artsub[0].split('^')[0];
                                objCountry1.name = cnty1cnty2artsub[0].split('^')[1];
                                objCountry1.shortName = "";
                                objCountry1.ordering = cnty1cnty2artsub[0].split('^')[1]?.toLowerCase() ?? "";
                                objCountry1.type = "country1";
                                objCountry1.url = Common.GetUrl(objCountry1.name);
                                if (!!objCountry1.name?.trim()) countries.push(objCountry1.name.toLowerCase().trim());
                            }
                            if (cnty1cnty2artsub?.[1] !== null) {
                                if (cnty1cnty2artsub[1].length > 5 && cnty1cnty2artsub[1].split('^')[0] !== "000000000000000000") {
                                    objCountry2.id = cnty1cnty2artsub[1].split('^')[0];
                                    objCountry2.pid = objCountry1.id;
                                    objCountry2.name = cnty1cnty2artsub[1].split('^')[1].trim();
                                    objCountry2.shortName = "";
                                    objCountry2.ordering = cnty1cnty2artsub[1].split('^')[1]?.toLowerCase() ?? "";
                                    objCountry2.type = "country2";
                                    objCountry2.url = Common.GetUrl(objCountry2.name);
                                    if (!!objCountry2.name?.trim()) countries.push(objCountry2.name.toLowerCase().trim());
                                }
                            }
                            if (cnty1cnty2artsub?.length > 2 && cnty1cnty2artsub[2] !== null) {
                                if (objArticle && cnty1cnty2artsub[2].length > 5) {
                                    objArticle.id = cnty1cnty2artsub[2].split('^')[0];
                                    objArticle.name = cnty1cnty2artsub[2].split('^')[1].split('#')[0];
                                    objArticle.shortName = "";
                                    objArticle.ordering = cnty1cnty2artsub[2].split('^')[1].split('#')[1];
                                    objArticle.type = "article";
                                    objArticle.url = Common.GetUrl(objArticle.name);
                                    if (!!objArticle.name?.trim()) articles.push(objArticle.name.toLowerCase().trim());
                                }
                            }
                            if (cnty1cnty2artsub?.length > 3 && cnty1cnty2artsub[3] !== null) {
                                if (cnty1cnty2artsub[3].length > 5) {
                                    objSubject.id = cnty1cnty2artsub[3].split('^')[0];
                                    objSubject.name = cnty1cnty2artsub[3].split('^')[1];
                                    objSubject.shortName = "";
                                    objSubject.ordering = cnty1cnty2artsub[3].split('^')[1]?.toLowerCase() ?? "";
                                    objSubject.type = "subject";
                                    objSubject.url = Common.GetUrl(objSubject.name);
                                    if (!!objSubject.name?.trim()) subjects.push(objSubject.name.toLowerCase().trim());
                                }
                            }
                            if (cnty1cnty2artsub?.length > 4 && cnty1cnty2artsub[4] !== null) {
                                if (cnty1cnty2artsub[4].length > 5) {
                                    objSubSubject.id = cnty1cnty2artsub[4].split('^')[0];
                                    objSubSubject.pid = objSubject.id;
                                    objSubSubject.name = cnty1cnty2artsub[4].split('^')[1];
                                    objSubSubject.shortName = "";
                                    objSubSubject.ordering = cnty1cnty2artsub[4].split('^')[1]?.toLowerCase() ?? "";
                                    objSubSubject.type = "subsubject";
                                    objSubSubject.url = Common.GetUrl(objSubSubject.name);
                                    if (!!objSubSubject.name?.trim()) subjects.push(objSubSubject.name.toLowerCase().trim());
                                }
                            }
                            const flags = !!dr?.["flaginfo"] ? dr["flaginfo"].toString().split('|') : null;
                            if (flags !== null && flags.length === 2) {
                                objFlag1.id = flags[0].trim();
                                objFlag1.name = flags[0].toUpperCase().trim().replace("'", "");
                                objFlag1.ordering = flags[0].toLowerCase().trim().replace("'", "");
                                objFlag1.url = flags[0].toLowerCase().trim().replace("'", "");
                                objFlag1.orderInteger = 0;
                                objFlag2.id = flags[1].trim();
                                objFlag2.name = flags[1].toUpperCase().trim().replace("'", "");
                                objFlag2.ordering = flags[1].toLowerCase().trim().replace("'", "");
                                objFlag2.url = flags[1].toLowerCase().trim().replace("'", "");
                                objFlag2.orderInteger = 0;
                            }
                            const cnty2Id = objCountry2.id ?? "000000000000000000";
                            const artId = objArticle.id ?? "000000000000000000";
                            const subId = objSubject.id ?? "000000000000000000";
                            const subSubId = objSubSubject.id ?? "000000000000000000";
                            searchIltCitation.push({ name: objCountry1.id + cnty2Id + artId + subId + subSubId + yr });

                            objIltInfoes.push({ country1: objCountry1, country2: objCountry2, article: objArticle, subject: objSubject, subsubject: objSubSubject, flag1: objFlag1, flag2: objFlag2 });
                        }
                    }

                    // objCitations.journal = objJournals;
                    // objCitations.volume = objVolumes
                    // objCitations.page = objPages;
                    // objMasters.citations = objCitations;
                    // Masterinfo objMaster = new Masterinfo();
                    // objMaster.info = objMasterInfo;
                    indexDocument.masterinfo = objMasters;
                    const objSearchIltCit: SearchIltCitation = { formattediltcitation: searchIltCitation };
                    indexDocument.searchiltcitation = objSearchIltCit;
                    if (countries.length > 0) {
                        objSuggest.push({
                            Input: countries,
                            Weight: 8,
                        });
                    }
                    if (articles.length > 0) {
                        objSuggest.push({
                            Input: articles,
                            Weight: 1,
                        });
                    }
                    if (subjects.length > 0) {
                        objSuggest.push({
                            Input: subjects,
                            Weight: 16,
                        });
                    }
                    objMasters.iltinfoes = objIltInfoes;
                    indexDocument.masterinfo = objMasters;
                    //if (!!indexDocument.heading)
                    //    objSuggest.push(indexDocument.heading.trim());
                    //if (!!indexDocument.subheading)
                    //    objSuggest.push(indexDocument.subheading.trim());
                    indexDocument.Suggest = objSuggest;
                    indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(`${(dr["categoriescentax"]?.toString() ?? "").toLowerCase()} ${(dr["groups"]?.toString() ?? "").toLowerCase()} ${indexDocument.searchheadingnumber ?? ""} ${indexDocument.parentheadings?.[0]?.name?.trim() ?? ""}`);
                    indexDocument.shortcontent = (dr["shortcontent"]?.toString() ?? "").trim();

                    //#region footnote region
                    let fullContent = '';
                    let footnotecontent = '';

                    const doc = document.createElement('div');
                    doc.innerHTML = dr["fullcontent"]?.toString() ?? "";
                    const isHtmlFootnote = doc.getElementsByClassName('footprint').length > 0;

                    if (isHtmlFootnote && indexDocument.documentformat === '.htm') {
                        const footprintElements = doc.getElementsByClassName('footprint');
                        for (const item of Array.from(footprintElements)) {
                            item.remove();
                            footnotecontent += item.outerHTML;
                        }
                        fullContent = doc.innerHTML;
                    } else if ((dr["fullcontent"]?.toString() ?? "").indexOf("<footnote>") !== -1) {
                        const regexfootnote = /<footnote>(.*?)<\/footnote>/gi;
                        const matchesfootnote = (dr["fullcontent"]?.toString() ?? "").match(regexfootnote) ?? [];
                        for (const matchfoot of matchesfootnote) {
                            footnotecontent += matchfoot;
                        }
                        fullContent = (dr["fullcontent"]?.toString() ?? "").replace(regexfootnote, '');
                    } else {
                        fullContent = dr["fullcontent"]?.toString() ?? "";
                    }
                    indexDocument.footnotecontent = footnotecontent;
                    //#endregion footnote

                    //#region remove header tag from full content
                    if ((dr["fullcontent"]?.toString() ?? "").indexOf("<header>") !== -1) {
                        fullContent = Common.RemovedHeaderTag(fullContent);
                    }
                    //#endregion

                    //#region xml meta tag
                    if ((dr["fullcontent"]?.toString() ?? "").indexOf("<header>") !== -1) {
                        indexDocument.xmltag = Common.GetMetaTag(dr["fullcontent"]?.toString() ?? "");
                    } else {
                        indexDocument.xmltag = "";
                    }
                    //#endregion

                    indexDocument.fullcontent = fullContent.trim().lastIndexOf("</document>") !== -1
                        ? fullContent.trim().replace("</document>", `<div id='xmlmetadata' style='display:none;'>${indexDocument.searchboosttext}</div></document>`)
                        : fullContent.lastIndexOf("</html>") !== -1
                            ? fullContent.trim().replace("</html>", `<div id='htmmetadata' style='display:none;'>${indexDocument.searchboosttext}</div></html>`)
                            : fullContent.trim() + `<div id='nodata' style='display:none;'>${indexDocument.searchboosttext}</div>`;

                    indexDocument.created_date = new Date(`${dr["created_date"]?.toString()?.substring(0, 4)}-${dr["created_date"]?.toString()?.substring(4, 2)}-${dr["created_date"]?.toString()?.substring(6, 2)} ${dr["created_date"]?.toString()?.substring(8, 2)}:${dr["created_date"]?.toString()?.substring(10, 2)}:${dr["created_date"]?.toString()?.substring(12, 2)}`) || new Date("1900-01-01");
                    const formatteddate = indexDocument.documentdate?.toString() ?? "1900-01-01";
                    //indexDocument.updated_date = new Date(`${new Date(formatteddate).getFullYear()}-${String(new Date(formatteddate).getMonth() + 1).padStart(2, '0')}-${String(new Date(formatteddate).getDate()).padStart(2, '0')}`);
                    indexDocument.updated_date = new Date(`${dr["UpdatedDate"]?.toString()?.substring(0, 4)}-${dr["UpdatedDate"]?.toString()?.substring(4, 2)}-${dr["UpdatedDate"]?.toString()?.substring(6, 2)} ${dr["UpdatedDate"]?.toString()?.substring(8, 2)}:${dr["UpdatedDate"]?.toString()?.substring(10, 2)}:${dr["UpdatedDate"]?.toString()?.substring(12, 2)}`) || new Date("1900-01-01");

                    indexDocument.ispublished = true;
                    indexDocument.lastpublished_date = new Date();
                    indexDocument.lastQCDate = new Date();
                    indexDocument.isshowonsite = true;
                    indexDocument.boostpopularity = 1000;
                    indexDocument.viewcount = 10;
                    indexDocumentList.push(indexDocument);



                } catch (ex: any) {
                    Common.LogError(ex, "mid = " + dr["mid"]);
                    console.log("error:" + dr["mid"] + ex.message);
                    Common.LogErrorId(dr["mid"]?.toString());

                }
            }
            console.log("Document Batch No completed: " + i);

            let status: string = '';
            // if (indexType === 1) {
            //     status = await BulkIndexing(indexDocumentList, 'x', IndexLocalPath, IndexName, IndexDocument, docType);
            // } else {
            //     status = await BulkIndexing(indexDocumentList, 'x', IndexLocalPath, IndexNameStopword, IndexDocument, docType);
            // }
        }
    }
}

async function CommentaryIndex(dt: any, docType: number, templateid: string): Promise<number> {
    let indexDocumentList: IndexDocument[] = [];
    const batchSize: number = 50; // magicll
    const totalBatches: number = Math.ceil(dt.Rows.Count / batchSize);
    console.log("Total Document Batch Started:" + totalBatches + "\r\n");
    let reccount: number = 0;
    for (let i: number = 0; i < totalBatches; i++) {
        indexDocumentList = [];
        console.log("Document Batch No started:" + i + "\r\n");
        const dataRows = dt.AsEnumerable().slice(i * batchSize, (i + 1) * batchSize);
        if (dataRows.length > 0) {
            reccount = dataRows.length;
            for (const dr of dataRows) {
                try {
                    let objSuggest: CompletionField[] = [];
                    let indexDocument: IndexDocument = {} as IndexDocument;
                    indexDocument.id = dr["mid"]?.toString()?.trim();
                    indexDocument.mid = dr["id"]?.toString()?.trim();
                    indexDocument.templateid = templateid;
                    if (!!dr["groups"] && dr["groups"]?.toString()?.includes("111050000000000971^Models & Drafts")) {
                        indexDocument.documenttype = "form";
                        indexDocument.documenttypeboost = 7500;
                    } else if (!!dr["groups"] && dr["groups"]?.toString()?.includes("111050000000000972^Challans")) {
                        indexDocument.documenttype = "form";
                        indexDocument.documenttypeboost = 7500;
                    } else if (!!dr["groups"] && dr["groups"]?.toString()?.includes("111050000000000084")) {
                        indexDocument.documenttypeboost = 1500;
                    } else {
                        indexDocument.documenttype = dr["documenttype"]?.toString()?.toLowerCase()?.trim() || "";
                        indexDocument.documenttypeboost = 900;
                    }
                    indexDocument.documentformat = dr["documentformat"]?.toString()?.toLowerCase()?.trim() || "";
                    indexDocument.filenamepath = dr["url"]?.toString()?.trim() || "";
                    if (dr["url"]?.toString()?.toLowerCase()?.includes(".pdf")) {
                        // indexDocument.filenamepath = new Common().UploadPdfFilesOnAmazonS3Bucket(indexDocument.id, indexDocument.filenamepath);
                    }
                    Common.UploadLinkFilesOnS3Centax(indexDocument.mid, "commentary", indexDocument.documentformat, dr["url"]?.toString()?.trim() || "", indexDocument.id);
                    try {
                        Common.UploadImageOnAmazonS3BucketCentax(indexDocument.id, indexDocument.mid);
                    } catch (ex) {
                        Common.LogError(ex, "mid = " + dr["mid"] + " s3 upload error");
                    }
                    const year: string = dr["year"]?.toString()?.trim() || "";
                    if (!!year && year !== "0000") {
                        indexDocument.year = { id: year.trim(), name: year.trim() };
                    }
                    const objMasters: Masterinfo = {} as Masterinfo;
                    const objMasterInfo: Info = {} as Info;

                    // #region subject master
                    const caseSubjectArray = !!dr["OtherSubject"] ? dr["OtherSubject"].toString().split("$") : null;
                    const objsubjects: GenericInfo[] = [];

                    if (caseSubjectArray != null && caseSubjectArray.length > 1) {
                        for (const association of caseSubjectArray) {
                            const associations = association.split("|");

                            if (associations != null && associations.length > 1) {
                                const objSubject: GenericInfo = {} as GenericInfo;

                                const type = associations[0] !== "" ? associations[1].split("^")[0].toLowerCase() : "";
                                if (type.trim() === "subject") {
                                    if (!!associations[0]) {
                                        objSubject.id = associations[0].trim();
                                        objSubject.type = type;
                                        objSubject.name = associations[1] !== "" ? associations[1].split("^")[1].split("~")[0] : "";
                                        objSubject.shortName = "";
                                        objSubject.ordering = associations[1].split("^")[1].split("~")[1];
                                        objSubject.orderInteger = 0;
                                        objSubject.url = Common.GetUrl(objSubject.name.toLowerCase());
                                        objsubjects.push(objSubject);
                                        if (!!objSubject.name.trim()) {
                                            objSuggest.push({
                                                Input: [objSubject.name.toLowerCase().trim()],
                                                Weight: 18
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        objMasterInfo.subject = objsubjects;
                    }
                    // #endregion

                    // #region act associations
                    const associationArray = !!dr["DDA_Acts"] ? dr["DDA_Acts"].toString().split("$") : null;
                    const objAssociates: Associates = {} as Associates;

                    if (associationArray != null && associationArray.length > 1) {
                        const objActs: GenericInfo[] = [];
                        const objSections: GenericInfo[] = [];
                        const objActAssociations: Associate[] = [];
                        const objSectionAssociations: Associate[] = [];

                        for (const association of associationArray) {
                            const associations = association.split("|");

                            if (associations != null && associations.length > 1) {
                                const objAct: GenericInfo = {} as GenericInfo;
                                const objSection: GenericInfo = {} as GenericInfo;
                                const objActAssociate: Associate = {} as Associate;
                                const objSectionAssociate: Associate = {} as Associate;
                                const actidsecid = associations[0].toString().indexOf("#") !== -1 ? associations[0].toString().trim().split("#") : null;
                                const type = associations[0] !== "" ? associations[1].split("^")[0].toLowerCase() : "";

                                if (type.trim() === "act") {
                                    if (!!associations[0]) {
                                        objAct.id = objActAssociate.id = associations[0].trim();
                                        objAct.type = objActAssociate.type = type;
                                        objAct.name = objActAssociate.name = associations[1] !== "" ? associations[1].split("^")[1].split("~")[0] : "";
                                        objAct.shortName = "";
                                        objAct.ordering = associations[1].split("^")[1].indexOf("~") !== -1 ? associations[1].split("^")[1].split("~")[1] : objAct.name.toLowerCase();
                                        objAct.orderInteger = 0;
                                        objActAssociate.associatedDocid = "";
                                        objAct.url = objActAssociate.url = Common.GetUrl(objActAssociate.name.toLowerCase());
                                        objActs.push(objAct);
                                        objActAssociations.push(objActAssociate);
                                    }
                                } else {
                                    let section = associations[1] !== "" ? associations[1].split("^")[1] : "";
                                    if (!!section && !isNaN(Number(section.substring(0, 1)))) {
                                        section = "Section - " + section;
                                    }


                                    if (!!associations[0]) {
                                        objSection.id = objSectionAssociate.id = actidsecid[1];
                                        objSection.pid = actidsecid[0];
                                        objSection.type = objSectionAssociate.type = type;
                                        objSection.name = objSectionAssociate.name = section.indexOf("~") !== -1 ? section.split("~")[0] : section;
                                        objSection.shortName = "";
                                        objSection.ordering = section.indexOf("~") !== -1 ? section.split("~")[1] : "";
                                        objSectionAssociate.associatedDocid = associations[0];
                                        objSection.url = objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name.toLowerCase());
                                        objSections.push(objSection);
                                        objActAssociations.push(objSectionAssociate);
                                    }
                                }
                            }
                        }
                        objAssociates.act = objActAssociations;
                        objAssociates.section = objSectionAssociations;
                        // indexDocument.associates = objAssociates;
                        objMasterInfo.act = objActs;
                        objMasterInfo.section = objSections;
                    }
                    // #endregion

                    // #region aaa association binding
                    const asindases = !!dr["AAAAssociation"] ? dr["AAAAssociation"].toString().split("$") : null;
                    // const aaagroup = !!dr["AAAGroupAssociation"] ? dr["AAAGroupAssociation"].toString().substring(dr["AAAGroupAssociation"].toString().lastIndexOf("AAAGP") + 5) : "";

                    if (asindases != null) {
                        const objstandardsinfoes: GenericInfo[] = [];
                        const objsubstandardsinfoes: GenericInfo[] = [];

                        for (const asindas of asindases) {
                            if (!!asindas) {
                                const asindasinfo = asindas.split('@');
                                const groupinfo = asindasinfo[1].split('~');
                                const standardInfo = asindasinfo[0].split('|');

                                if (!!asindasinfo[0].split('|')[0]) {
                                    const alreadyExist = objstandardsinfoes.some(p => p.id === groupinfo[0]);
                                    const objstandardinfo: GenericInfo = {} as GenericInfo;

                                    if (!alreadyExist) {
                                        objstandardinfo.id = groupinfo[0];
                                        objstandardinfo.type = "standards"; // Type
                                        objstandardinfo.name = groupinfo[1]; // aaagroup == "111050000000011678" ? "accounting standard" : "ind as";
                                        objstandardinfo.shortName = objstandardinfo.name;
                                        objstandardinfo.ordering = objstandardinfo.shortName.toLowerCase();
                                        objstandardinfo.orderInteger = 0;
                                        objstandardinfo.url = Common.GetUrl(objstandardinfo.shortName.toLowerCase());
                                        objstandardsinfoes.push(objstandardinfo);
                                    }

                                    const objsubstandardinfo: GenericInfo = {} as GenericInfo;
                                    objsubstandardinfo.id = standardInfo[0].trim();
                                    objsubstandardinfo.pid = groupinfo[0];
                                    objsubstandardinfo.type = "substandards"; // Type
                                    objsubstandardinfo.name = standardInfo[1].replace('^', '-');
                                    objsubstandardinfo.shortName = objsubstandardinfo.name;
                                    objsubstandardinfo.ordering = objsubstandardinfo.shortName.toLowerCase();
                                    objsubstandardinfo.orderInteger = 0;
                                    objsubstandardinfo.url = Common.GetUrl(standardInfo[1].split('^')[0]);
                                    objsubstandardsinfoes.push(objsubstandardinfo);
                                }
                            }
                        }

                        objMasterInfo.standards = objstandardsinfoes;
                        objMasterInfo.substandards = objsubstandardsinfoes;
                    }
                    // #endregion end of aaa association binding
                    objMasters.info = objMasterInfo;

                    // #endregion

                    // #region rule associations
                    const ruleAssociationArray = !!dr["DDA_Rules"] ? dr["DDA_Rules"].toString().split("$") : null;

                    if (ruleAssociationArray != null && ruleAssociationArray.length > 1) {
                        const objRuleAssociations: Associate[] = [];
                        const objRuleNoAssociations: Associate[] = [];

                        for (const association of ruleAssociationArray) {
                            const associations = association.split("|");

                            if (associations != null && associations.length > 1) {
                                const objRuleAssociate: Associate = {} as Associate;
                                const objRulenoAssociate: Associate = {} as Associate;
                                const ruleidrulenoid = associations[0].toString().indexOf("#") !== -1 ? associations[0].toString().trim().split("#") : null;
                                const type = associations[0] !== "" ? associations[1].split("^")[0].toLowerCase() : "";

                                if (type.trim() === "rule") {
                                    if (!!associations[0]) {
                                        objRuleAssociate.id = associations[0].trim();
                                        objRuleAssociate.type = type;
                                        objRuleAssociate.name = associations[1] !== "" ? associations[1].split("^")[1] : "";
                                        objRuleAssociate.associatedDocid = "";
                                        objRuleAssociate.url = Common.GetUrl(objRuleAssociate.name.toLowerCase());
                                        objRuleAssociations.push(objRuleAssociate);
                                    }
                                } else {
                                    let ruleno = associations[1] !== "" ? associations[1].split("^")[1] : "";
                                    if (!!ruleno && !isNaN(Number(ruleno.substring(0, 1)))) {
                                        ruleno = "Rule - " + ruleno;
                                    }


                                    if (!!ruleidrulenoid[1]) {
                                        objRulenoAssociate.id = ruleidrulenoid[1];
                                        objRulenoAssociate.type = type;
                                        objRulenoAssociate.name = ruleno;
                                        objRulenoAssociate.associatedDocid = ruleidrulenoid[0];
                                        objRulenoAssociate.url = Common.GetUrl(objRulenoAssociate.name.toLowerCase());
                                        objRuleNoAssociations.push(objRulenoAssociate);
                                    }
                                }
                            }
                        }

                        objAssociates.rule = objRuleAssociations;
                        objAssociates.ruleno = objRuleNoAssociations;
                    }

                    indexDocument.associates = objAssociates;
                    // #endregion

                    // #region cat subcat binding

                    const catSubCatArray = dr["categoriescentax"] ? String(dr["categoriescentax"]).split('$') : null;
                    if (catSubCatArray !== null) {
                        const objCatList: Category[] = [];
                        for (const catsubcat of catSubCatArray) {
                            if (catsubcat) {
                                const objCat: Category = {} as Category;
                                const objSubCat: Subcategory = {} as Subcategory;
                                const isprimarycat = catsubcat.split('%')?.length > 1 ? Number(catsubcat.split('%')[1]) : 0;
                                if (catsubcat.indexOf('|') > 0) {
                                    const catidname = catsubcat.split('|');
                                    const mainCat = catidname[1].trim().split('^')[0].trim();
                                    const isRequiredCategory = mainCat.includes("111050000000018392") || mainCat.includes("111050000000018393") || mainCat.includes("111050000000018400") || mainCat.includes("111050000000018768") || mainCat.includes("111050000000018769") || mainCat.includes("111050000000018770") || mainCat.includes("111050000000018771") || mainCat.includes("111050000000018772") || mainCat.includes("111050000000019031");
                                    if (!isRequiredCategory) {
                                        continue;
                                    }
                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objCat.id = catidname[1].trim().split('^')[0].trim();
                                            objCat.name = catidname[1]?.split('^')[1]?.trim().split('%')[0];
                                            objCat.url = Common.GetUrl(objCat.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.competitionCategoryId:
                                            objCat.id = Constants.competitionCategoryId;
                                            objCat.name = Constants.competitionCategory;
                                            objCat.url = Common.GetUrl(objCat.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.tpCategoryId:
                                            objCat.id = Constants.tpCategoryId;
                                            objCat.name = Constants.tpCategory;
                                            objCat.url = Common.GetUrl(objCat.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.iltCategoryId:
                                            objCat.id = Constants.iltCategoryId;
                                            objCat.name = Constants.iltCategory;
                                            objCat.url = Common.GetUrl(objCat.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        default:
                                            objCat.id = catidname[0].trim().split('^')[0].trim();
                                            objCat.name = catidname[0]?.split('^')[1]?.trim().split('%')[0];
                                            objCat.url = Common.GetUrl(objCat.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                    }

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objSubCat.id = catidname[2].trim().split('^')[0].trim();
                                            objSubCat.name = catidname[2]?.split('^')[1]?.trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name?.toLowerCase());
                                            break;
                                        case Constants.competitionCategoryId:
                                            objSubCat.id = Constants.competitionCategoryId;
                                            objSubCat.name = Constants.competitionCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name?.toLowerCase());
                                            break;
                                        case Constants.tpCategoryId:
                                            objSubCat.id = Constants.tpCategoryId;
                                            objSubCat.name = Constants.tpCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name?.toLowerCase());
                                            break;
                                        case Constants.iltCategoryId:
                                            objSubCat.id = Constants.iltCategoryId;
                                            objSubCat.name = Constants.iltCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name?.toLowerCase());
                                            break;
                                        default:
                                            objSubCat.id = catidname[1].trim().split('^')[0].trim();
                                            objSubCat.name = catidname[1]?.split('^')[1]?.trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name?.toLowerCase());
                                            break;
                                    }

                                    objCat.subcategory = objSubCat;
                                } else {
                                    objCat.id = catsubcat.split('^')[0]?.trim();
                                    objCat.name = catsubcat.split('^')[1]?.trim().split('%')[0];
                                    objCat.url = Common.GetUrl(objCat.name?.toLowerCase());
                                    objCat.isprimarycat = isprimarycat;

                                    objSubCat.id = "";
                                    objSubCat.name = "";
                                    objSubCat.url = "";
                                    objCat.subcategory = objSubCat;
                                }
                                objCatList.push(objCat);
                            }
                        }
                        indexDocument.categories = objCatList;
                    }
                    // #endregion


                    // #region Groups binding

                    const groupSubgroupArray = !!dr["groups"] ? (String(dr["groups"]).split('|')) : null;
                    if (!!dr["groups"] && String(dr["groups"]).indexOf("111050000000000971^Models & Drafts") !== -1) {
                        indexDocument.groups = {
                            group: {
                                id: "111050000000000026",
                                name: "form",
                                url: "form",
                                subgroup: {
                                    id: groupSubgroupArray?.[0]?.split('^')[0],
                                    name: groupSubgroupArray?.[0]?.split('^')[1]?.split('#')[0]?.trim(),
                                    ordering: groupSubgroupArray?.[0]?.split('^')[1]?.split('#')[1]?.trim(),
                                    url: Common.GetUrl(groupSubgroupArray?.[0]?.split('^')[1]?.split('#')[0]?.trim()),
                                    subsubgroup: {
                                        id: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? groupSubgroupArray?.[1]?.split('^')[0] : "",
                                        name: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? groupSubgroupArray?.[1]?.split('^')[1]?.split('#')[0]?.trim() : "",
                                        ordering: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? groupSubgroupArray?.[1]?.split('^')[1]?.split('#')[1]?.trim() : "",
                                        url: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? Common.GetUrl(groupSubgroupArray?.[1]?.split('^')[1]?.split('#')[0]?.trim()) : ""
                                    }
                                }
                            }
                        };
                    } else if (!!dr["groups"] && String(dr["groups"]).indexOf("111050000000000972^Challans") !== -1) {
                        indexDocument.groups = {
                            group: {
                                id: "111050000000000026",
                                name: "form",
                                url: "form",
                                subgroup: {
                                    id: groupSubgroupArray?.[0]?.split('^')[0],
                                    name: groupSubgroupArray?.[0]?.split('^')[1]?.split('#')[0]?.trim(),
                                    ordering: groupSubgroupArray?.[0]?.split('^')[1]?.split('#')[1]?.trim(),
                                    url: Common.GetUrl(groupSubgroupArray?.[0]?.split('^')[1]?.split('#')[0]?.trim()),
                                    subsubgroup: {
                                        id: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? groupSubgroupArray?.[1]?.split('^')[0] : "",
                                        name: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? groupSubgroupArray?.[1]?.split('^')[1]?.split('#')[0]?.trim() : "",
                                        ordering: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? groupSubgroupArray?.[1]?.split('^')[1]?.split('#')[1]?.trim() : "",
                                        url: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? Common.GetUrl(groupSubgroupArray?.[1]?.split('^')[1]?.split('#')[0]?.trim()) : ""
                                    }
                                }
                            }
                        };
                    } else {
                        if (!!groupSubgroupArray) {
                            const objGroups: Groups = {};
                            const objSubGroup: Subgroup = {};
                            if (groupSubgroupArray[1]?.indexOf('^') !== -1) {
                                objSubGroup.id = groupSubgroupArray[1]?.split('^')[0]?.trim();
                                if (objSubGroup.id === "111050000000000153") {
                                    objSubGroup.name = "DTC Bill, 2010";
                                } else if (objSubGroup.id === "111050000000017825") {
                                    objSubGroup.name = "DTC Bill, 2009";
                                } else if (objSubGroup.id === "111050000000017824") {
                                    objSubGroup.name = "DTC Reports";
                                } else {
                                    objSubGroup.name = groupSubgroupArray[1]?.split('^')[1]?.split('#')[0]?.trim();
                                }
                                objSubGroup.ordering = groupSubgroupArray[1]?.split('^')[1]?.split('#')[1]?.trim();
                                objSubGroup.url = Common.GetUrl(objSubGroup.name?.toLowerCase());
                            }
                            const objSubSubGroup: Subsubgroup = {} as Subsubgroup;
                            if (groupSubgroupArray.length > 2 && groupSubgroupArray[2] !== null && !!groupSubgroupArray[2]) {
                                objSubSubGroup.id = groupSubgroupArray[2]?.split('^')[0]?.trim();
                                objSubSubGroup.name = groupSubgroupArray[2]?.split('^')[1]?.split('#')[0]?.trim();
                                objSubSubGroup.ordering = groupSubgroupArray[2]?.split('^')[1]?.split('#')[1]?.trim();
                                objSubSubGroup.url = Common.GetUrl(objSubSubGroup.name?.toLowerCase());
                            }
                            const objSubSubSubGroup: Subsubsubgroup = {} as Subsubsubgroup;
                            if (groupSubgroupArray.length > 3 && groupSubgroupArray[3] !== null && !!groupSubgroupArray[3]) {
                                objSubSubSubGroup.id = groupSubgroupArray[3]?.split('^')[0]?.trim();
                                if (objSubSubSubGroup.id === "111050000000000108" && indexDocument?.year?.name === "2019") {
                                    objSubSubSubGroup.name = "Finance Act, 2019";
                                } else if (objSubSubSubGroup.id === "111050000000000108" && indexDocument?.year?.name === "2020") {
                                    objSubSubSubGroup.name = "Finance Act, 2020";
                                } else if (objSubSubSubGroup.id === "111050000000017782") {
                                    objSubSubSubGroup.name = "Finance (No. 2) Act, 2019";
                                } else if (objSubSubSubGroup.id === "111050000000017788") {
                                    objSubSubSubGroup.name = "Taxation Laws (Amendment) Act, 2019";
                                } else {
                                    objSubSubSubGroup.name = groupSubgroupArray[3]?.split('^')[1]?.split('#')[0]?.trim();
                                }
                                objSubSubSubGroup.ordering = groupSubgroupArray[3]?.split('^')[1]?.split('#')[1]?.trim();
                                objSubSubSubGroup.url = Common.GetUrl(objSubSubSubGroup.name?.toLowerCase());
                            }
                            objSubSubGroup.subsubsubgroup = objSubSubSubGroup;
                            objSubGroup.subsubgroup = objSubSubGroup;
                            objGroups.group = {
                                id: groupSubgroupArray[0]?.split('^')[0]?.trim(),
                                name: groupSubgroupArray[0]?.split('^')[1]?.split('#')[0]?.trim(),
                                ordering: groupSubgroupArray[0]?.split('^')[1]?.split('#')[1]?.trim(),
                                url: Common.GetUrl(groupSubgroupArray[0]?.split('^')[1]?.split('#')[0]?.toLowerCase()?.trim()),
                                subgroup: objSubGroup
                            };
                            //objSubGroup.subsubgroup =[];
                            indexDocument.groups = objGroups;
                        }
                    }
                    // #endregion group binding

                    indexDocument.documentdate = dr["documentdate"]?.toString().split('^')[0] || "";
                    indexDocument.formatteddocumentdate = new Date(!!indexDocument.documentdate ? `${indexDocument.documentdate.substring(0, 4)}-${indexDocument.documentdate.substring(4, 6)}-${indexDocument.documentdate.substring(6, 8)}` : "1900-01-01");
                    if ((dr["groups"]?.toString().indexOf("111050000000000153") ?? -1) !== -1 && (dr["year"]?.toString() === "2010")) {
                        const objSByte = Number(dr["Heading"]?.substring(0, 1));
                        let section = objSByte ? `Section - ${dr["Heading"]}` : "";
                        indexDocument.heading = !!dr["heading"] ? section : dr["subheading"]?.toString() || "";
                    } else {
                        indexDocument.heading = dr["heading"]?.toString().trim() || dr["subheading"]?.toString() || "";
                    }
                    indexDocument.subheading = dr["heading"]?.toString().trim() ? dr["subheading"]?.toString().trim() || "" : "";
                    indexDocument.sortheading = dr["sortheading"]?.toString().toLowerCase().trim() || "";
                    indexDocument.sortheadingnumber = dr["sortheadingnumber"]?.toString().toLowerCase().trim() || "";
                    indexDocument.searchheadingnumber = dr["searchheadingnumber"]?.toString().toLowerCase().trim() || "";
                    const hasFile = !!dr["ParentFile"]?.toString().toLowerCase().includes("fileyes") ? "yes" : "no";
                    const parents = (dr["parentidheading"]?.toString().trimStart('|').split('|') ?? "000000000000000000|".split('|'));
                    if (parents[0]?.split('^')[0]?.length > 15) {
                        const Pid = parents.length > 1 ? parents[1]?.split('^')[0] : "";
                        const PName = (parents.length > 1 && parents[1] !== "") ? parents[1]?.split('^')[1]?.indexOf('#') !== -1 ? parents[1]?.split('^')[1]?.split('#')[0] : parents[1]?.split('^')[1] : "";
                        const Name = parents[0]?.split('^')[1]?.trim() || "";
                        indexDocument.parentheadings = [
                            {
                                id: parents[0]?.split('^')[0]?.trim(),
                                name: indexDocument?.groups?.group?.subgroup.url !== null && indexDocument?.groups?.group?.subgroup?.url?.includes("direct-tax-code") && year.includes("2010") && Name.toLowerCase().trim().indexOf("schedules") === -1 ? "Chapter " + Name.split('#')[0] : Name.split('#')[0],
                                ordering: parents[0]?.split('^').length > 1 ? Name.split('#')[1] : "",
                                orderInteger: parents[0]?.split('^').length > 1 ? parseInt(Name.split('#')[1]) : 0,
                                hasfile: hasFile,
                                pid: Pid,
                                pname: PName,
                            }
                        ];
                        //#region  searchboosttext entry
                        indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(`${dr["categoriescentax"]?.toString().toLowerCase()} ${dr["groups"]?.toString().toLowerCase()} ${dr["year"]?.toString().toLowerCase()} ${Common.StringOnly(dr["masterinfo"]?.toString().toLowerCase())} ${indexDocument?.parentheadings?.[0]?.name?.trim()} ${indexDocument.heading}`);
                        // indexDocument.searchboosttextnew = common.RemoveSpecialCharacterWithSpace(`${dr["categoriescentax"]?.toString().toLowerCase()} ${dr["groups"]?.toString().toLowerCase()} ${dr["year"]?.toString().toLowerCase()} ${common.StringOnly(dr["masterinfo"]?.toString().toLowerCase())} ${dr["Heading"]?.toString().trim()} ${dr["subheading"]?.toString().trim()}`);
                        //#endregion 
                    }
                    indexDocument.shortcontent = dr["shortcontent"]?.toString().trim() || "";

                    // #region footnote region
                    let fullContent: string = "";
                    const footnotecontent: string[] = [];
                    const { window } = new JSDOM();
                    const doc = new window.DOMParser().parseFromString(!!dr["fullcontent"] ? dr["fullcontent"].toString() : "", 'text/html');
                    const isHtmlFootnote = doc.querySelectorAll("div.footprint").length > 0;

                    if (isHtmlFootnote && indexDocument.documentformat === ".htm") {
                        const footnoteItems = doc.querySelectorAll("div.footprint");
                        for (const item of footnoteItems) {
                            item.remove();
                            footnotecontent.push(item.outerHTML);
                        }
                        fullContent = doc.body.innerHTML;
                    } else if (!!dr["fullcontent"]?.toString().includes("<footnote>")) {
                        const regexfootnote = /<footnote>(.*?)<\/footnote>/g;
                        const matchesfootnote = (!!dr["fullcontent"]?.toString() ? dr["fullcontent"].toString().match(regexfootnote) : []) || [];

                        for (const matchfoot of matchesfootnote) {
                            footnotecontent.push(matchfoot);
                        }
                        fullContent = dr["fullcontent"]?.toString().replace(regexfootnote, "") || "";
                    } else {
                        fullContent = dr["fullcontent"]?.toString() || "";
                    }
                    indexDocument.footnotecontent = footnotecontent.join('');
                    // #endregion footnote

                    // #region remove header tag from full content
                    if (!!dr["fullcontent"]?.toString().includes("<header>")) {
                        fullContent = Common.RemovedHeaderTag(fullContent);
                    }
                    // #endregion

                    // #region xml meta tag
                    if (!!dr["fullcontent"]?.toString().includes("<header>")) {
                        indexDocument.xmltag = Common.GetMetaTag(dr["fullcontent"]?.toString() || "");
                    } else {
                        indexDocument.xmltag = "";
                    }
                    // #endregion

                    indexDocument.fullcontent = fullContent.trim().replace(/<\/document>/, `<div id='xmlmetadata' style='display:none;'>${indexDocument.searchboosttext}</div></document>`)
                        || fullContent.trim().replace(/<\/html>/, `<div id='htmmetadata' style='display:none;'>${indexDocument.searchboosttext}</div></html>`)
                        || fullContent.trim() + `<div id='nodata' style='display:none;'>${indexDocument.searchboosttext}</div>`;

                    indexDocument.url = dr["url"]?.toString().toLowerCase().trim() || "";
                    indexDocument.language = ""; // dr["language"]?.toString().toLowerCase().trim() || "";

                    indexDocument.masterinfo = objMasters;
                    // ... (continue the rest of the code)
                    // #region marking info
                    const markinginfoArray = !!dr["MarkingInfo"] ? dr["MarkingInfo"].toString().split('$') : null;
                    let topStoryHeading = "";
                    let topStoryDesc = "";

                    if (markinginfoArray) {
                        const objMarkingInfoes: Markinginfo[] = [];
                        let num: number = 0;

                        for (const markinginfo of markinginfoArray) {
                            num++;
                            const markings = markinginfo.split('|');

                            if (markings && markings.length > 1) {
                                const marking1 = markings[1].replace("&#39;", "'");
                                const markingInfo: Markinginfo = {
                                    number: num,
                                    text: markings[0].toLowerCase(),
                                    image: marking1.split('^')[0],
                                    entrydate: marking1.split('^')[1].split('##')[1].split('@@i')[1].split('~')[1].split('\\')[0],
                                    updateddate: marking1.split('^')[1].split('##')[1].split('@@i')[1].split('~')[1].split('\\')[1].replace('_', ' ').trim().split('@@e')[0],
                                    parentmarking: (marking1.indexOf('@@t') !== -1) ? `${marking1.split('@@t')[0]}, ${marking1.split('@@t')[1]}`.replace(/^,+/, '').toLowerCase() : undefined


                                };

                                if (num === 1) {
                                    topStoryHeading = marking1.split('^')[1].split('##')[0];
                                    topStoryDesc = marking1.split('^')[1].split('##')[1].split('@@i')[0];
                                }

                                objMarkingInfoes.push(markingInfo);
                            }
                        }
                        indexDocument.markinginfo = objMarkingInfoes;
                    } else {
                        indexDocument.markinginfo = [{ number: 0, text: "", image: "", entrydate: new Date().toLocaleDateString(), updateddate: new Date().toLocaleDateString() }];
                    }
                    indexDocument.topstoryheading = topStoryHeading;
                    indexDocument.topstorydesc = topStoryDesc;
                    // #endregion end marking info

                    // #region tag info
                    const taginfoArray = !!dr["TagInfo"] ? dr["TagInfo"].toString().split('$') : null;
                    if (taginfoArray) {
                        const objTagInfoes: Taginfo[] = [];

                        for (const taginfo of taginfoArray) {
                            const tags = taginfo.split('|');

                            for (const tag of tags) {
                                if (!!tag) {
                                    const tagInfo: Taginfo = {
                                        id: tag.split('^')[0],
                                        name: tag.length > 0 ? tag.split('^')[1] : tag.split('^')[0]
                                    };
                                    objTagInfoes.push(tagInfo);
                                }
                            }
                        }
                        indexDocument.taginfo = objTagInfoes;
                    } else {
                        indexDocument.taginfo = [{ id: dr["TagInfo"]?.toString(), name: dr["TagInfo"]?.toString() }];
                    }
                    // #endregion
                    indexDocument.Suggest = objSuggest;
                    indexDocument.created_date = new Date(!!dr["created_date"]?.toString() && dr["created_date"].toString().length > 12 ? `${dr["created_date"].toString().substring(0, 4)}-${dr["created_date"].toString().substring(4, 6)}-${dr["created_date"].toString().substring(6, 8)} ${dr["created_date"].toString().substring(8, 10)}:${dr["created_date"].toString().substring(10, 12)}:${dr["created_date"].toString().substring(12, 14)}` : "1900-01-01");
                    const formatteddate = !!indexDocument.documentdate ? `${indexDocument.documentdate.substring(0, 4)}-${indexDocument.documentdate.substring(4, 6)}-${indexDocument.documentdate.substring(6, 8)}` : "1900-01-01";
                    indexDocument.updated_date = new Date(!!dr["UpdatedDate"]?.toString() ? `${dr["UpdatedDate"].toString().substring(0, 4)}-${dr["UpdatedDate"].toString().substring(4, 6)}-${dr["UpdatedDate"].toString().substring(6, 8)} ${dr["UpdatedDate"].toString().substring(8, 10)}:${dr["UpdatedDate"].toString().substring(10, 12)}:${dr["UpdatedDate"].toString().substring(12, 14)}` : "1900-01-01");
                    indexDocument.ispublished = true;
                    indexDocument.lastpublished_date = new Date(new Date().toISOString().substr(0, 10));
                    indexDocument.lastQCDate = new Date(new Date().toISOString().substr(0, 10));
                    indexDocument.isshowonsite = true;
                    indexDocument.boostpopularity = 1000;
                    indexDocument.viewcount = 10;
                    const filteredCategory: Category[] = [];
                    if (!!indexDocument.categories)
                        for (const objCategory of indexDocument?.categories) {
                            const isRequiredCategory = (objCategory.id === "111050000000018392" || objCategory.id === "111050000000018393" || objCategory.id === "111050000000018400");
                            objCategory.name = objCategory.name?.replace(/centax /gi, '');
                            objCategory.name = objCategory.name?.replace(/Centax /g, '');
                            if (isRequiredCategory) {
                                filteredCategory.push(objCategory);
                            }
                        }
                    indexDocument.categories = filteredCategory;
                    indexDocumentList.push(indexDocument);



                    // (Continued as the rest of the code was not provided)
                } catch (ex) {
                    Common.LogError(ex, "mid = " + dr["mid"]);
                    console.log("error:" + dr["mid"] + ex.message);
                    Common.LogErrorId(dr["mid"].toString());

                }
            }
            console.log("Document Batch No completed:" + i + "\r\n");
            let status = '';
            // if (indexType === 1) {
            //     status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexName, IndexDocument, docType);
            // } else {
            //     status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexNameStopword, IndexDocument, docType);
            // }
            // Assuming `BulkIndexing` is an asynchronous function that returns a promise
            // It seems like `GC.Collect()` isn't applicable in TypeScript/JavaScript

        }
    }
    return reccount;
}

async function CommentaryBookIndex(dt: any, docType: number, templateid: string): Promise<void> {
    let indexDocumentList: IndexDocument[] = [];
    const batchSize: number = 10;
    const totalBatches: number = Math.ceil(dt.Rows.Count / batchSize);
    console.log("Total Document Batch Started:" + totalBatches + "\r\n");

    for (let i: number = 0; i < totalBatches; i++) {
        console.log("Document Batch No started:" + i + "\r\n");
        const dataRows = dt.AsEnumerable().Skip(i * batchSize).Take(batchSize);

        if (dataRows.length > 0) {
            for (const dr of dataRows) {
                try {
                    const indexDocument: IndexDocument = {} as IndexDocument;
                    indexDocument.id = dr["mid"].toString().trim();
                    indexDocument.mid = dr["id"].toString().trim();
                    indexDocument.templateid = templateid;
                    indexDocument.documenttype = dr["documenttype"].toString().toLowerCase().trim();
                    indexDocument.documenttypeboost = 20;

                    indexDocument.documentformat = dr["documentformat"].toString().toLowerCase().trim();
                    indexDocument.filenamepath = dr["filenamepath"].toString().trim();
                    indexDocument.filenamepath = Common.pdfFileManagementiReader(indexDocument.id, indexDocument.filenamepath, "");
                    // Common.CopyLinkFiles(indexDocument.mid, indexDocument.id, "commentary");
                    // indexDocument.categories.push({ id: "111050000000000002", name: "Direct Tax Laws", subcategory: { id: "111050000000009187", name: "Direct Tax Laws" } });
                    // indexDocument.groups = { group: { id: "", name: "", subgroup: { id: "", name: "", subsubgroup: { id: "", name: "", subsubsubgroup: { id: "", name: "", subsubsubsubgroup: { id: "", name: "" } } } } } };
                    // Common.UploadImageOnAmazonS3Bucket(indexDocument.id, System.Configuration.ConfigurationManager.AppSettings["ebookReaderImagePath"]);
                    const year: string = dr["year"].toString().trim();
                    if (!!year && year !== "0000") {
                        indexDocument.year = { id: year, name: year };
                    }
                    const objMasters: Masterinfo = {} as Masterinfo;
                    const objMasterInfo: Info = {} as Info;
                    // ...
                    // Additional code for objMasterInfo setup goes here
                    // ...
                    // #region act associations
                    const bookMasterInfo = !!dr["masterinfo"] ? dr["masterinfo"].toString().split('|') : null;

                    if (bookMasterInfo && bookMasterInfo.length > 1) {
                        const objProdId: GenericInfo[] = [];
                        const objDateofPublication: GenericInfo[] = [];
                        const objBookType: GenericInfo[] = [];
                        const objprodinfo: GenericInfo = {
                            id: bookMasterInfo[0],
                            type: "productid",
                            name: bookMasterInfo[0],
                            shortName: bookMasterInfo[0],
                            ordering: bookMasterInfo[0].toLowerCase(),
                            orderInteger: 0,
                            url: Common.GetUrl(bookMasterInfo[0].toLowerCase())
                        };
                        objProdId.push(objprodinfo);

                        const dateOfPublicationinfo: GenericInfo = {
                            id: bookMasterInfo[1],
                            type: "dateofpublication",
                            name: bookMasterInfo[1],
                            shortName: bookMasterInfo[1],
                            ordering: bookMasterInfo[1].toLowerCase(),
                            orderInteger: 0,
                            url: Common.GetUrl(bookMasterInfo[1].toLowerCase())
                        };
                        objDateofPublication.push(dateOfPublicationinfo);

                        const objBookTypeInfo: GenericInfo = {
                            id: bookMasterInfo[2],
                            type: "booktype",
                            name: bookMasterInfo[2],
                            shortName: bookMasterInfo[2],
                            ordering: bookMasterInfo[2].toLowerCase(),
                            orderInteger: 0,
                            url: Common.GetUrl(bookMasterInfo[2].toLowerCase())
                        };
                        objBookType.push(objBookTypeInfo);

                        objMasterInfo.prodid = objProdId;
                        objMasterInfo.dateofpublication = objDateofPublication;
                        objMasterInfo.booktype = objBookType;

                    }

                    objMasters.info = objMasterInfo;
                    // #endregion

                    //#region cat subcat binding
                    const catSubCatArray = !!dr["categoriescentax"] ? ("" + dr["categoriescentax"]).split('$') : null;

                    if (catSubCatArray) {
                        const objCatList: Category[] = [];

                        for (const catsubcat of catSubCatArray) {
                            if (!!catsubcat) {
                                const objCat: Category = {} as Category;
                                const objSubCat: Subcategory = {} as Subcategory;

                                const isprimarycat: number = catsubcat.split('%').length > 1 ? parseInt(catsubcat.split('%')[1]) : 0;

                                if (catsubcat.indexOf('|') > 0) {
                                    const catidname: string[] | null = catsubcat ? catsubcat.split('|') : null;
                                    const mainCat: string | undefined = catidname?.[1].trim().split('^')[0].trim();
                                    const isRequiredCategory: boolean | undefined = (
                                        mainCat?.includes("111050000000018392") ||
                                        mainCat?.includes("111050000000018393") ||
                                        mainCat?.includes("111050000000018400") ||
                                        mainCat?.includes("111050000000018768") ||
                                        mainCat?.includes("111050000000018769") ||
                                        mainCat?.includes("111050000000018770") ||
                                        mainCat?.includes("111050000000018771") ||
                                        mainCat?.includes("111050000000018772") ||
                                        mainCat?.includes("111050000000019031")
                                    );

                                    if (!isRequiredCategory) {
                                        continue;
                                    }

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objCat.id = catidname?.[1].trim().split('^')[0].trim();
                                            objCat.name = catidname?.[1].split('^')[1].trim().split('%')[0];
                                            objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.competitionCategoryId:
                                            objCat.id = Constants.competitionCategoryId;
                                            objCat.name = Constants.competitionCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.tpCategoryId:
                                            objCat.id = Constants.tpCategoryId;
                                            objCat.name = Constants.tpCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.iltCategoryId:
                                            objCat.id = Constants.iltCategoryId;
                                            objCat.name = Constants.iltCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        default:
                                            objCat.id = catidname?.[0].trim().split('^')[0].trim();
                                            objCat.name = catidname?.[0].split('^')[1].trim().split('%')[0];
                                            objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                    }

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objSubCat.id = catidname?.[2].trim().split('^')[0].trim();
                                            objSubCat.name = catidname?.[2].split('^')[1].trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                            break;
                                        case Constants.competitionCategoryId:
                                            objSubCat.id = Constants.competitionCategoryId;
                                            objSubCat.name = Constants.competitionCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.tpCategoryId:
                                            objSubCat.id = Constants.tpCategoryId;
                                            objSubCat.name = Constants.tpCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.iltCategoryId:
                                            objSubCat.id = Constants.iltCategoryId;
                                            objSubCat.name = Constants.iltCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        default:
                                            objSubCat.id = catidname?.[1].trim().split('^')[0].trim();
                                            objSubCat.name = catidname?.[1].split('^')[1].trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                            break;
                                    }

                                    objCat.subcategory = objSubCat;
                                } else {
                                    objCat.id = catsubcat.split('^')[0].trim();
                                    objCat.name = catsubcat.split('^')[1].trim().split('%')[0];
                                    objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                    objCat.isprimarycat = isprimarycat;

                                    objSubCat.id = "";
                                    objSubCat.name = "";
                                    objSubCat.url = "";
                                    objCat.subcategory = objSubCat;
                                }

                                objCatList.push(objCat);
                            }
                        }

                        indexDocument.categories = objCatList;
                    }
                    //#endregion

                    // #region Groups binding
                    const groupSubgroupArray = (!!dr["groups"] ? String(dr["groups"]).split('|') : null);
                    if (!!dr["groups"] && String(dr["groups"]).indexOf("111050000000000971^Models & Drafts") !== -1) {
                        indexDocument.groups = {
                            group: {
                                id: "111050000000000026",
                                name: "form",
                                url: "form",
                                subgroup: {
                                    id: groupSubgroupArray?.[0].split('^')[0],
                                    name: groupSubgroupArray?.[0].split('^')[1].split('#')[0].trim(),
                                    ordering: groupSubgroupArray?.[0].split('^')[1].split('#')[1].trim(),
                                    url: Common.GetUrl(groupSubgroupArray?.[0].split('^')[1].split('#')[0].trim()),
                                    subsubgroup: {
                                        id: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? groupSubgroupArray?.[1].split('^')[0] : "",
                                        name: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? groupSubgroupArray?.[1].split('^')[1].split('#')[0].trim() : "",
                                        ordering: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? groupSubgroupArray?.[1].split('^')[1].split('#')[1].trim() : "",
                                        url: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? Common.GetUrl(groupSubgroupArray?.[1].split('^')[1].split('#')[0].trim()) : ""
                                    }
                                }
                            }
                        };
                    } else if (!!dr["groups"] && String(dr["groups"]).indexOf("111050000000000972^Challans") !== -1) {
                        indexDocument.groups = {
                            group: {
                                id: "111050000000000026",
                                name: "form",
                                url: "form",
                                subgroup: {
                                    id: groupSubgroupArray?.[0].split('^')[0],
                                    name: groupSubgroupArray?.[0].split('^')[1].split('#')[0].trim(),
                                    ordering: groupSubgroupArray?.[0].split('^')[1].split('#')[1].trim(),
                                    url: Common.GetUrl(groupSubgroupArray?.[0].split('^')[1].split('#')[0].trim()),
                                    subsubgroup: {
                                        id: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? groupSubgroupArray?.[1].split('^')[0] : "",
                                        name: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? groupSubgroupArray?.[1].split('^')[1].split('#')[0].trim() : "",
                                        ordering: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? groupSubgroupArray?.[1].split('^')[1].split('#')[0].trim() : "",
                                        url: groupSubgroupArray?.[1] !== null && groupSubgroupArray?.[1] !== "" ? Common.GetUrl(groupSubgroupArray?.[1].split('^')[1].split('#')[0].trim()) : ""
                                    }
                                }
                            }
                        };
                    } else {
                        if (!!groupSubgroupArray) {
                            const objGroups = {} as Groups;
                            const objSubGroup = {} as Subgroup;
                            if (groupSubgroupArray[1].indexOf('^') !== -1) {
                                objSubGroup.id = groupSubgroupArray[1].split('^')[0].trim();
                                if (objSubGroup.id === "111050000000000153") {
                                    objSubGroup.name = "DTC Bill, 2010";
                                } else if (objSubGroup.id === "111050000000017825") {
                                    objSubGroup.name = "DTC Bill, 2009";
                                } else if (objSubGroup.id === "111050000000017824") {
                                    objSubGroup.name = "DTC Reports";
                                } else {
                                    objSubGroup.name = groupSubgroupArray[1].split('^')[1].split('#')[0].trim();
                                }
                                objSubGroup.ordering = groupSubgroupArray[1].split('^')[1].split('#')[1].trim();
                                objSubGroup.url = Common.GetUrl(objSubGroup.name.toLowerCase());
                            }
                            const objSubSubGroup = {} as Subsubgroup;
                            if (groupSubgroupArray.length > 2 && groupSubgroupArray[2] !== null && !!groupSubgroupArray[2]) {
                                objSubSubGroup.id = groupSubgroupArray[2].split('^')[0].trim();
                                objSubSubGroup.name = groupSubgroupArray[2].split('^')[1].split('#')[0].trim();
                                objSubSubGroup.ordering = groupSubgroupArray[2].split('^')[1].split('#')[1].trim();
                                objSubSubGroup.url = Common.GetUrl(objSubSubGroup.name.toLowerCase());
                            }
                            const objSubSubSubGroup = {} as Subsubsubgroup;
                            if (groupSubgroupArray.length > 3 && groupSubgroupArray[3] !== null && !!groupSubgroupArray[3]) {
                                objSubSubSubGroup.id = groupSubgroupArray[3].split('^')[0].trim();
                                if (objSubSubSubGroup.id === "111050000000000108" && indexDocument?.year?.name === "2019") {
                                    objSubSubSubGroup.name = "Finance Act, 2019";
                                } else if (objSubSubSubGroup.id === "111050000000000108" && indexDocument?.year?.name === "2020") {
                                    objSubSubSubGroup.name = "Finance Act, 2020";
                                } else if (objSubSubSubGroup.id === "111050000000017782") {
                                    objSubSubSubGroup.name = "Finance (No. 2) Act, 2019";
                                } else if (objSubSubSubGroup.id === "111050000000017788") {
                                    objSubSubSubGroup.name = "Taxation Laws (Amendment) Act, 2019";
                                } else {
                                    objSubSubSubGroup.name = groupSubgroupArray[3].split('^')[1].split('#')[0].trim();
                                }
                                objSubSubSubGroup.ordering = groupSubgroupArray[3].split('^')[1].split('#')[1].trim();
                                objSubSubSubGroup.url = Common.GetUrl(objSubSubSubGroup.name.toLowerCase());
                            }
                            const objSubSubSubSubGroup: Subsubsubsubgroup = {} as Subsubsubsubgroup;
                            if (groupSubgroupArray.length > 4 && groupSubgroupArray[4] !== null && !!groupSubgroupArray[4]) {
                                objSubSubSubSubGroup.id = groupSubgroupArray[4].split('^')[0].trim();

                                objSubSubSubSubGroup.name = groupSubgroupArray[4].split('^')[1].split('#')[0].trim();
                                objSubSubSubSubGroup.ordering = groupSubgroupArray[4].split('^')[1].split('#')[1].trim();
                                objSubSubSubSubGroup.url = Common.GetUrl(objSubSubSubSubGroup.name.toLowerCase());
                            }
                            objSubSubSubGroup.subsubsubsubgroup = objSubSubSubSubGroup;
                            objSubSubGroup.subsubsubgroup = objSubSubSubGroup;
                            objSubGroup.subsubgroup = objSubSubGroup;
                            objGroups.group = {
                                id: groupSubgroupArray[0].split('^')[0].trim(),
                                name: groupSubgroupArray[0].split('^')[1].split('#')[0].trim(),
                                ordering: groupSubgroupArray[0].split('^')[1].split('#')[1].trim(),
                                url: Common.GetUrl(groupSubgroupArray[0].split('^')[1].split('#')[0].toLowerCase().trim()),
                                subgroup: objSubGroup
                            };
                            // objSubGroup.subsubgroup = [];
                            indexDocument.groups = objGroups;
                        }
                    }
                    // #endregion group binding

                    // indexDocument.documentdate = dr["documentdate"].ToString().split('^')[0];
                    indexDocument.documentdate = String(dr["documentdate"]).split('^')[0];

                    let objNumber: number;
                    if (String(dr["groups"]).indexOf("111050000000017984") !== -1 && !!dr["parentidheading"]) {
                        if (!!dr["heading"] && /^\d+$/.test(dr["heading"].substring(0, 1))) {
                            indexDocument.heading = "Section - " + dr["heading"];
                        } else {
                            indexDocument.heading = dr["heading"];
                        }
                    } else if (String(dr["groups"]).indexOf("111050000000017981") !== -1 && !dr["parentidheading"] && indexDocument.documentformat !== ".pdf") {
                        if (String(dr["groups"]).toLowerCase().indexOf("regulations") !== -1) {
                            indexDocument.heading = "Regulation - " + dr["heading"];
                        } else if (!!dr["heading"] && /^\d+$/.test(dr["heading"].substring(0, 1))) {
                            indexDocument.heading = "Rule - " + dr["heading"];
                        } else {
                            indexDocument.heading = dr["heading"];
                        }
                    } else {
                        if (!dr["heading"]) {
                            indexDocument.heading = dr["subheading"];
                        } else {
                            indexDocument.heading = dr["heading"];
                        }
                    }
                    indexDocument.subheading = dr["heading"] ? String(dr["subheading"]).trim() : "";
                    indexDocument.sortheading = String(dr["sortheading"]).toLowerCase().trim();
                    indexDocument.sortheadingnumber = String(dr["sortheadingnumber"]).toLowerCase().trim();
                    indexDocument.searchheadingnumber = String(dr["searchheadingnumber"]).toLowerCase().trim();
                    const hasFile = !!dr["ParentFile"] && String(dr["ParentFile"]).toLowerCase().indexOf("fileyes") !== -1 ? "yes" : "no";
                    const parents = !!dr["parentidheading"] ? Common.customTrimStart(String(dr["parentidheading"]), '|').split('|') : "000000000000000000|".split('|');
                    if (parents !== null && parents[0].split('^')[0].length > 15) {
                        const Pid = parents.length > 1 ? parents[1].split('^')[0] : "";
                        const PName = (parents.length > 1 && parents[1] !== "") ? (parents[1].split('^')[1].indexOf('#') !== -1 ? parents[1].split('^')[1].split('#')[0] : parents[1].split('^')[1]) : "";
                        const Name = parents[0].split('^').length > 1 ? parents[0].split('^')[1].trim() : "";
                        indexDocument.parentheadings = [
                            {
                                id: parents[0].split('^')[0].trim(),
                                name: indexDocument?.groups?.group?.subgroup.url !== null && indexDocument?.groups?.group?.subgroup?.url?.indexOf("direct-tax-code") !== -1 && year.indexOf("2010") !== -1 && Name.toLowerCase().trim().indexOf("schedules") === -1 ? "Chapter " + Name.split('#')[0] : Name.split('#')[0],
                                ordering: parents[0].split('^').length > 1 ? Name.split('#')[1] : "",
                                orderInteger: parents[0].split('^').length > 1 ? parseInt(Name.split('#')[1]) : 0,
                                hasfile: hasFile,
                                pid: Pid,
                                pname: PName
                            }
                        ];
                        // #region searchboosttext entry
                        if (!!indexDocument.parentheadings)
                            indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(
                                `${String(dr["categoriescentax"]).toLowerCase()} ${String(dr["groups"]).toLowerCase()} ${String(dr["year"]).toLowerCase()} ${Common.StringOnly(String(dr["masterinfo"]).toLowerCase())} ${indexDocument.heading} ${indexDocument?.parentheadings?.[0]?.name?.trim() ?? ''}`
                            );

                        // #endregion
                    }
                    indexDocument.shortcontent = String(dr["shortcontent"]).trim();

                    // #region footnote region
                    const fullContent = String(dr["fullcontent"]);
                    const footnotecontent = document.createDocumentFragment();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(fullContent, "text/html");
                    const isHtmlFootnote = !!doc.querySelector(".footprint");

                    if (isHtmlFootnote && indexDocument.documentformat === ".htm") {
                        const footnoteNodes = doc.querySelectorAll(".footprint");
                        footnoteNodes.forEach((item) => {
                            footnotecontent.appendChild(item.cloneNode(true));
                            item.remove();
                        });
                    } else if (fullContent.indexOf("<footnote>") !== -1) {
                        const regexfootnote = /<footnote>(.*?)<\/footnote>/g;

                        const matchesfootnote = fullContent.match(regexfootnote) || [];
                        matchesfootnote.forEach((matchfoot) => {
                            const div = document.createElement("div");
                            div.innerHTML = matchfoot;
                            footnotecontent.appendChild(div);
                        });
                    }
                    indexDocument.footnotecontent = footnotecontent.toString();
                    // #endregion footnote

                    // #region remove header tag from full content
                    if (fullContent.indexOf("<header>") !== -1) {
                        const removedHeaderContent = Common.RemovedHeaderTag(fullContent);
                        indexDocument.fullcontent = removedHeaderContent;
                    } else {
                        indexDocument.fullcontent = fullContent;
                    }
                    // #endregion

                    // #region xml meta tag
                    if (fullContent.indexOf("<header>") !== -1) {
                        indexDocument.xmltag = Common.GetMetaTag(fullContent);
                    } else {
                        indexDocument.xmltag = "";
                    }
                    // #endregion

                    const lastDocumentIndex = fullContent.lastIndexOf("</document>");
                    const lastHtmlIndex = fullContent.lastIndexOf("</html>");
                    indexDocument.fullcontent = lastDocumentIndex !== -1
                        ? indexDocument.fullcontent.replace("</document>", `<div id='xmlmetadata' style='display:none;'>${indexDocument.searchboosttext}</div></document>`)
                        : lastHtmlIndex !== -1
                            ? indexDocument.fullcontent.replace("</html>", `<div id='htmmetadata' style='display:none;'>${indexDocument.searchboosttext}</div></html>`)
                            : `${indexDocument.fullcontent.trim()}<div id='nodata' style='display:none;'>${indexDocument.searchboosttext}</div>`;

                    indexDocument.url = String(dr["url"]).toLowerCase().trim();
                    indexDocument.language = String(dr["language"]).toLowerCase().trim();

                    indexDocument.masterinfo = objMasters;

                    // #region marking info
                    const markinginfoArray = !!dr["MarkingInfo"] ? String(dr["MarkingInfo"]).split('$') : null;
                    let topStoryHeading = "";
                    let topStoryDesc = "";

                    if (markinginfoArray != null) {
                        const objMarkingInfoes: Markinginfo[] = [];
                        let num: number = 0;

                        for (const markinginfo of markinginfoArray) {
                            num++;
                            const markings = markinginfo.split('|');
                            if (markings != null && markings.length > 1) {
                                const marking1 = markings[1].replace("&#39;", "'");
                                const markingInfo: Markinginfo = {} as Markinginfo;
                                markingInfo.number = num;
                                markingInfo.text = markings[0].toLowerCase();
                                markingInfo.image = marking1.split('^')[0];
                                if (num === 1) {
                                    const topStoryParts = marking1.split('^')[1].split("##");
                                    topStoryHeading = topStoryParts[0];
                                    topStoryDesc = topStoryParts[1].split("@@i")[0];
                                }
                                const entryAndUpdatedDate = marking1.split("^")[1].split("##")[1].split("@@i")[1].split("~")[1].split("\\");
                                const pmark = marking1.indexOf("@@e") !== -1 ? entryAndUpdatedDate[1].split("~")[1].split("\\")[1].replace('_', ' ').split("@@e")[1] : "";
                                const parentmark = marking1.indexOf("@@t") !== -1 ? pmark.split("@@t") : null;

                                markingInfo.entrydate = entryAndUpdatedDate[0];
                                markingInfo.updateddate = entryAndUpdatedDate[1].replace('_', ' ').split("@@e")[0];
                                if (parentmark != null) {
                                    markingInfo.parentmarking = Common.customTrimStart(`${parentmark[0]}, ${parentmark[1]}`, ',').toLowerCase();
                                }
                                objMarkingInfoes.push(markingInfo);
                            }
                        }
                        indexDocument.markinginfo = objMarkingInfoes;
                    } else {
                        indexDocument.markinginfo = [{} as Markinginfo];
                    }
                    indexDocument.topstoryheading = topStoryHeading;
                    indexDocument.topstorydesc = topStoryDesc;
                    // #endregion end marking info

                    // #region tag info
                    const taginfoArray = !!dr["TagInfo"] ? String(dr["TagInfo"]).split('$') : null;
                    if (taginfoArray != null) {
                        const objTagInfoes: Taginfo[] = [];
                        for (const taginfo of taginfoArray) {
                            const tags = taginfo.split('|');
                            for (const tag of tags) {
                                if (!!tag) {
                                    const tagInfo: Taginfo = {} as Taginfo;
                                    tagInfo.id = tag.split('^')[0];
                                    tagInfo.name = tag.split('^')[1];
                                    objTagInfoes.push(tagInfo);
                                }
                            }
                        }
                        indexDocument.taginfo = objTagInfoes;
                    } else {
                        indexDocument.taginfo = [{} as Taginfo];
                    }
                    // #endregion


                    // Add indexDocument to the list
                    indexDocumentList.push(indexDocument);
                } catch (ex) {
                    Common.LogError(ex, `mid = ${dr["mid"]}`);
                    console.error(`error: ${dr["mid"]} ${ex.message}`);
                    Common.LogErrorId(String(dr["mid"]));
                }
            }
            console.log(`Document Batch No completed: ${i}\r\n`);
            let status = '';
            // if (indexType === 1) {
            //     status = await BulkIndexing(indexDocumentList, 'x', IndexLocalPath, IndexName, IndexDocument, docType);
            // } else {
            //     status = await BulkIndexing(indexDocumentList, 'x', IndexLocalPath, IndexNameStopword, IndexDocument, docType);
            // }
            // GC.Collect();
        }
    }
}

async function AAAIndex(dt: any, docType: number, templateid: string): Promise<void> {
    let indexDocumentList: IndexDocument[] = [];
    const batchSize: number = 2000; // magic
    const totalBatches: number = Math.ceil(dt.Rows.length / batchSize);
    console.log("Total Document Batch Started:" + totalBatches + "\r\n");
    for (let i = 0; i < totalBatches; i++) {
        console.log("Document Batch No started:" + i + "\r\n");
        const dataRows = dt.Rows.slice(i * batchSize, (i + 1) * batchSize);
        if (dataRows.length > 0) {
            for (const dr of dataRows) {
                //console.log("log start for actid:" + dr["mid"]+ "\r\n");
                try {
                    const indexDocument: IndexDocument = {} as IndexDocument;
                    indexDocument.id = dr["mid"]?.toString()?.trim();
                    indexDocument.mid = dr["id"]?.toString()?.trim();
                    indexDocument.templateid = templateid;
                    indexDocument.documenttype = dr["documenttype"]?.toString()?.toLowerCase()?.trim();
                    indexDocument.documentformat = dr["documentformat"]?.toString()?.toLowerCase()?.trim();
                    indexDocument.filenamepath = dr["url"]?.toString()?.trim();
                    if (dr["url"]?.toString()?.toLowerCase()?.includes(".pdf")) {
                        indexDocument.filenamepath = new Common.UploadPdfFilesOnAmazonS3Bucket(indexDocument.id, indexDocument.filenamepath);
                    }
                    //Common.UploadLinkFilesOnS3(indexDocument.id, "aaa");
                    Common.UploadLinkFilesOnS3Centax(indexDocument.mid, "aaa", indexDocument.documentformat, dr["url"]?.toString()?.trim(), indexDocument.id);
                    //indexDocument.filenamepath = new Common().pdfFileManagement(indexDocument.id, indexDocument.filenamepath, "");
                    //Common.UploadImageOnAmazonS3Bucket(indexDocument.id);
                    if (dr["groups"]?.toString()?.includes("111050000000017331") || dr["groups"]?.toString()?.includes("111050000000011664")) {
                        indexDocument.documenttypeboost = 3000;
                    } else {
                        indexDocument.documenttypeboost = 950;
                    }

                    // #region PDF attachment data
                    if (!!dr["CompareFileInfo"]) {
                        const compareFileInfo = !!dr["CompareFileInfo"] ? dr["CompareFileInfo"].toString().split('|') : null;
                        const filePath = `${System.Configuration.ConfigurationManager.AppSettings["FilePath"]} ${compareFileInfo[1].toString().split('^')[0].replace(" / ", "\\")}`;
                        if (!!filePath.trim() && System.IO.File.Exists(filePath)) {
                            const compfilecontent = System.IO.File.Exists(filePath) ? System.IO.File.ReadAllText(filePath, System.Text.Encoding.Default) : "";
                            indexDocument.comparefilecontent = compfilecontent;
                            indexDocument.comparefileheading = compareFileInfo[1].toString().split('^')[1];
                        }
                    }
                    // #endregion

                    // indexDocument.categories.push({ id: "111050000000000002", name: "Direct Tax Laws", subcategory: { id: "111050000000009187", name: "Direct Tax Laws" } });
                    // indexDocument.groups = { group: { id: "", name: "", subgroup: { id: "", name: "", subsubgroup: { id: "", name: "", subsubsubgroup: { id: "", name: "", subsubsubsubgroup: { id: "", name: "" } } } } } };
                    const year = (!!dr["year"]).toString().trim();
                    if (!!year && year !== "0000") {
                        if (year.length > 4) {
                            indexDocument.year = { id: year.substring(0, 18).trim(), name: year.substring(18, 4).trim() };
                        } else if (year.trim().length === 4) {
                            indexDocument.year = { id: year.trim(), name: year.trim() };
                        }
                    } else {
                        indexDocument.year = { id: "", name: "" };
                    }


                    // #region category binding
                    const catSubCatArray = !!dr["categoriescentax"] ? dr["categoriescentax"].toString().split('$') : null;
                    if (catSubCatArray != null) {
                        const objCatList: Category[] = [];
                        for (const catsubcat of catSubCatArray) {
                            if (!!catsubcat) {
                                const objCat: Category = {} as Category;
                                const objSubCat: Subcategory = {} as Subcategory;
                                const isprimarycat = catsubcat.split('%').length > 1 ? parseInt(catsubcat.split('%')[1]) : 0;
                                if (catsubcat.indexOf('|') > 0) {
                                    const catidname = !!catsubcat ? catsubcat.split('|') : null;
                                    if (catidname[1].trim().split('^')[0] === "111050000000017777" || catidname[1].trim().split('^')[0] === "111050000000017778") {
                                        objCat.id = catidname[1].trim().split('^')[0].trim();
                                        objCat.name = catidname[1].split('^')[1].trim().split('%')[0];
                                        objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                        objCat.isprimarycat = isprimarycat;
                                    } else {
                                        objCat.id = catidname[0].trim().split('^')[0].trim();
                                        objCat.name = catidname[0].split('^')[1].trim().split('%')[0];
                                        objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                        objCat.isprimarycat = isprimarycat;
                                    }
                                    if (catidname[1].trim().split('^')[0] === "111050000000017777" || catidname[1].trim().split('^')[0] === "111050000000017778") {
                                        objSubCat.id = catidname[2].trim().split('^')[0].trim();
                                        objSubCat.name = catidname[2].split('^')[1].trim().split('%')[0];
                                        objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                    } else {
                                        objSubCat.id = catidname[1].trim().split('^')[0].trim();
                                        objSubCat.name = catidname[1].split('^')[1].trim().split('%')[0];
                                        objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                    }
                                    objCat.subcategory = objSubCat;
                                } else {
                                    objCat.id = catsubcat.split('^')[0].trim();
                                    objCat.name = catsubcat.split('^')[1].trim().split('%')[0];
                                    objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                    objCat.isprimarycat = isprimarycat;

                                    objSubCat.id = "";
                                    objSubCat.name = "";
                                    objSubCat.url = "";
                                    objCat.subcategory = objSubCat;
                                }
                                objCatList.push(objCat);
                            }
                        }
                        indexDocument.categories = objCatList;
                    }
                    // #endregion category

                    // #region Groups binding
                    const groupSubgroupArray = !!dr["groups"] ? dr["groups"].toString().split('|') : null;
                    if (groupSubgroupArray != null) {
                        const objGroups: Groups = {} as Groups;
                        const objSubGroup: Subgroup = {} as Subgroup;
                        const objSubSubGroup: Subsubgroup = {} as Subsubgroup;
                        const objSubSubSubGroup: Subsubsubgroup = {} as Subsubsubgroup;
                        const objSubSubSubSubGroup: Subsubsubsubgroup = {} as Subsubsubsubgroup;

                        if (groupSubgroupArray.length > 2 && groupSubgroupArray[2] !== null && !!groupSubgroupArray[2]) {
                            objSubGroup.id = groupSubgroupArray[2].split('^')[0].trim();
                            objSubGroup.name = groupSubgroupArray[2].split('^')[1].trim();
                            objSubGroup.url = Common.GetUrl(objSubGroup?.name?.toLowerCase());
                        }

                        if (groupSubgroupArray.length > 3 && groupSubgroupArray[3] !== null && !!groupSubgroupArray[3]) {
                            objSubSubGroup.id = groupSubgroupArray[3].split('^')[0].trim();
                            objSubSubGroup.name = groupSubgroupArray[3].split('^')[1].trim();
                            objSubSubGroup.url = Common.GetUrl(objSubSubGroup?.name?.toLowerCase());
                        }

                        if (groupSubgroupArray.length > 4 && groupSubgroupArray[4] !== null && !!groupSubgroupArray[4]) {
                            objSubSubSubGroup.id = groupSubgroupArray[4].split('^')[0].trim();
                            objSubSubSubGroup.name = groupSubgroupArray[4].split('^')[1].trim();
                            objSubSubSubGroup.url = Common.GetUrl(objSubSubSubGroup.name.toLowerCase());
                        }

                        if (groupSubgroupArray.length > 5 && groupSubgroupArray[5] !== null && !!groupSubgroupArray[5]) {
                            objSubSubSubSubGroup.id = groupSubgroupArray[5].split('^')[0].trim();
                            objSubSubSubSubGroup.name = groupSubgroupArray[5].split('^')[1].trim();
                            objSubSubSubSubGroup.url = Common.GetUrl(objSubSubSubSubGroup.name.toLowerCase());
                        }

                        objSubSubSubGroup.subsubsubsubgroup = objSubSubSubSubGroup;
                        objSubSubGroup.subsubsubgroup = objSubSubSubGroup;
                        objSubGroup.subsubgroup = objSubSubGroup;
                        objGroups.group = {} as Group;
                        objGroups.group.id = groupSubgroupArray[1].split('^')[0].trim();
                        objGroups.group.name = groupSubgroupArray[1].split('^')[1].trim();
                        objGroups.group.url = Common.GetUrl(groupSubgroupArray[1].split('^')[1].toLowerCase().trim());
                        objGroups.group.subgroup = objSubGroup;

                        indexDocument.groups = objGroups;
                    }
                    // #endregion group binding

                    indexDocument.heading = !!dr["Heading"] ? dr["Heading"].toString() : "";
                    indexDocument.subheading = !!dr["subheading"] ? dr["subheading"].toString().trim() : "";
                    indexDocument.sortheading = "";// !!dr["sortheading"] ? dr["sortheading"].toString().toLowerCase().trim() : "";

                    indexDocument.sortheadingnumber = !!dr["sortheadingnumber"] && dr["sortheadingnumber"].toString() !== "" ? dr["sortheadingnumber"].toString().toLowerCase().trim() : "0";
                    if (!!indexDocument.sortheadingnumber && parseInt(indexDocument?.sortheadingnumber) < 2147483647) {
                        indexDocument.sortnumber = parseInt(indexDocument?.sortheadingnumber);
                    }

                    indexDocument.url = !!dr["url"] ? dr["url"].toString().toLowerCase().trim() : "";
                    indexDocument.language = "";// !!dr["language"] ? dr["language"].toString().toLowerCase().trim() : "";

                    // #region master info
                    const objMasters: Masterinfo = {} as Masterinfo;
                    const objMasterInfo: Info = {} as Info;
                    const objCompanies: GenericInfo[] = [];
                    const objIndustries: GenericInfo[] = [];
                    const objasinfoes: GenericInfo[] = [];
                    const objindasinfoes: GenericInfo[] = [];

                    const masterinfoes = !!dr["masterinfo"] ? dr["masterinfo"].toString().split('$') : null;
                    if (masterinfoes != null && dr["masterinfo"].toString().length > 0) {
                        for (const masterinfo of masterinfoes) {
                            if (!!masterinfo) {
                                const masterdetail = masterinfo.split('^');
                                if (masterdetail[0].split('|')[1].toLowerCase() === "industry") {
                                    const objIndustry: GenericInfo = {} as GenericInfo;
                                    objIndustry.id = masterdetail[0].split('|')[0];
                                    objIndustry.type = masterdetail[0].split('|')[1];
                                    objIndustry.name = masterdetail[1].split('#')[0];
                                    objIndustry.shortName = "";
                                    objIndustry.ordering = masterdetail[1].split('#')[1];
                                    objIndustry.orderInteger = 0;
                                    objIndustry.url = Common.GetUrl(objIndustry.name);
                                    objIndustries.push(objIndustry);
                                } else if (masterdetail[0].split('|')[1].toLowerCase() === "company") {
                                    const objCompany: GenericInfo = {} as GenericInfo;
                                    objCompany.id = masterdetail[0].split('|')[0];
                                    objCompany.type = masterdetail[0].split('|')[1];
                                    objCompany.name = masterdetail[1].split('#')[0];
                                    objCompany.shortName = "";
                                    objCompany.ordering = masterdetail[1].split('#')[1];
                                    objCompany.orderInteger = 0;
                                    objCompany.url = Common.GetUrl(objCompany.name);
                                    objCompanies.push(objCompany);
                                } else if (masterdetail[0].split('|')[1].toLowerCase() === "account standard") {
                                    const objasinfo: GenericInfo = {} as GenericInfo;
                                    objasinfo.id = masterdetail[0].split('|')[0];
                                    objasinfo.type = masterdetail[0].split('|')[1];
                                    objasinfo.name = masterdetail[1].indexOf('#') !== -1 ? masterdetail[1].split('#')[0] : masterdetail[1];
                                    objasinfo.shortName = "";
                                    objasinfo.ordering = masterdetail[1].indexOf('#') !== -1 ? masterdetail[1].split('#')[1] : "";
                                    objasinfo.orderInteger = 0;
                                    objasinfo.url = masterdetail[1].indexOf(':') !== -1 ? Common.GetUrl(masterdetail[1].split(':')[0]) : Common.GetUrl(objasinfo.name);
                                    objasinfoes.push(objasinfo);
                                } else if (masterdetail[0].split('|')[1].toLowerCase() === "ind as") {
                                    const objindasinfo: GenericInfo = {} as GenericInfo;
                                    objindasinfo.id = masterdetail[0].split('|')[0];
                                    objindasinfo.type = masterdetail[0].split('|')[1];
                                    objindasinfo.name = masterdetail[1].indexOf('#') !== -1 ? masterdetail[1].split('#')[0] : masterdetail[1];
                                    objindasinfo.shortName = "";
                                    objindasinfo.ordering = masterdetail[1].indexOf('#') !== -1 ? masterdetail[1].split('#')[1] : "";
                                    objindasinfo.orderInteger = 0;
                                    objindasinfo.url = masterdetail[1].indexOf(':') !== -1 ? Common.GetUrl(masterdetail[1].split(':')[0]) : Common.GetUrl(objindasinfo.name);
                                    objindasinfoes.push(objindasinfo);
                                }
                            }
                        }
                    }

                    objMasterInfo.company = objCompanies;
                    objMasterInfo.industry = objIndustries;

                    const asindases = !!dr["AAAAssociation"] ? dr["AAAAssociation"].toString().split('$') : null;
                    if (asindases != null) {
                        for (const asindas of asindases) {
                            if (!!asindas) {
                                const asindasinfo = asindas.split('^');
                                const type = asindasinfo[0].split('|')[1].trim();
                                if (type !== "" && type.toLowerCase() === "account standard") {
                                    if (!!asindasinfo[0].split('|')[0]) {
                                        const objasinfo: GenericInfo = {} as GenericInfo;
                                        objasinfo.id = asindasinfo[0].split('|')[0].trim();
                                        objasinfo.type = "accountingstandard"; // Type
                                        objasinfo.name = asindasinfo[1].split('#')[0].trim();
                                        objasinfo.shortName = objasinfo?.name?.split(':')[0].trim();
                                        objasinfo.ordering = objasinfo?.shortName?.toLowerCase();
                                        objasinfo.orderInteger = parseInt(asindasinfo[1].split('#')[1].trim());
                                        objasinfo.url = Common.GetUrl(objasinfo?.shortName?.toLowerCase());
                                        objasinfoes.push(objasinfo);
                                    }
                                } else if (type !== "" && type.toLowerCase() === "ind as") {
                                    if (!!asindasinfo[0].split('|')[0]) {
                                        const objindasinfo: GenericInfo = {} as GenericInfo;
                                        objindasinfo.id = asindasinfo[0].split('|')[0].trim();
                                        objindasinfo.type = "indas"; // Type
                                        objindasinfo.name = asindasinfo[1].split('#')[0].trim();
                                        objindasinfo.shortName = objindasinfo?.name?.split(':')[0].trim();
                                        objindasinfo.ordering = objindasinfo?.shortName?.toLowerCase();
                                        objindasinfo.orderInteger = parseInt(asindasinfo[1].split('#')[1].trim());
                                        objindasinfo.url = Common.GetUrl(objindasinfo?.shortName?.toLowerCase());
                                        objindasinfoes.push(objindasinfo);
                                    }
                                }
                            }
                        }
                    }

                    objMasterInfo.accountingstandard = objasinfoes;
                    objMasterInfo.indas = objindasinfoes;

                    objMasters.info = objMasterInfo;
                    indexDocument.masterinfo = objMasters;

                    // #endregion


                    // #region Tagging Info
                    const taggingInfo = !!dr["TagInfo"] ? dr["TagInfo"].toString().split('$') : null;
                    const objTags: Taginfo[] = [];
                    if (taggingInfo != null && taggingInfo.length > 0) {
                        for (const taginfo of taggingInfo) {
                            const taginfos = !!taginfo ? taginfo.toString().split('|') : null;
                            if (!!taginfo) {
                                const objtaginfo: Taginfo = {} as Taginfo;
                                objtaginfo.id = taginfos[1].split('^')[0];
                                objtaginfo.name = taginfos[1].split('^')[1];
                                objTags.push(objtaginfo);
                            }
                        }
                    } else {
                        const taginfos = !!dr["TagInfo"] ? dr["TagInfo"].toString().split('|') : null;
                        if (taginfos != null) {
                            const objtaginfo: Taginfo = {} as Taginfo;
                            objtaginfo.id = taginfos[1].split('^')[0];
                            objtaginfo.name = taginfos[1].split('^')[1];
                            objTags.push(objtaginfo);
                        }
                    }
                    indexDocument.taginfo = objTags;
                    // #endregion Tagging info end

                    // #region paragraph info binding
                    const paragraphInfo = !!dr["paragraphinfo"] ? dr["paragraphinfo"].toString().split('$') : null;
                    const objParagraphs: ParagraphInfo[] = [];
                    if (paragraphInfo != null && paragraphInfo.length > 0) {
                        for (const parainfo of paragraphInfo) {
                            const parainfos = !!parainfo ? parainfo.toString().split('@') : null;
                            if (!!parainfo) {
                                const idnorder = !!parainfos[0] ? parainfos[0].toString().split('|') : null;
                                const objparafo: ParagraphInfo = {} as ParagraphInfo;
                                objparafo.pid = idnorder[0].substring(0, 18);
                                objparafo.cid = idnorder[0].substring(18);
                                objparafo.ordering = parseInt(idnorder[1].trim());
                                objparafo.name = parainfos[1];
                                objParagraphs.push(objparafo);
                            }
                        }
                        indexDocument.paragraphinfo = objParagraphs;
                    }
                    // #endregion end of paragraph info

                    indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(
                        (!!dr["categoriescentax"] ? dr["categoriescentax"].toString().toLowerCase() : "") +
                        (!!dr["groups"] ? dr["groups"].toString().toLowerCase() : "") +
                        (!!dr["year"] ? Common.StringOnly(dr["year"].toString()).toLowerCase() : "") +
                        (!!dr["masterinfo"] ? Common.StringOnly(dr["masterinfo"].toString()).toLowerCase() : "") +
                        (!!dr["Heading"] ? Common.StringOnly(dr["Heading"].toString()).toLowerCase() : "") +
                        (!!dr["subheading"] ? dr["subheading"].toString().toLowerCase() : "")
                    );
                    indexDocument.shortcontent = !!dr["shortcontent"] ? dr["shortcontent"].toString().trim() : "";

                    // import { JSDOM } from 'jsdom';

                    // #region footnote region
                    let fullContent: string = "";
                    let footnotecontent: string = "";

                    const dom = new JSDOM(dr["fullcontent"].toString());
                    const document = dom.window.document;
                    const isHtmlFootnote: boolean = !!document.querySelectorAll('.footprint').length;

                    if (isHtmlFootnote && indexDocument.documentformat === ".htm") {
                        const footprints = document.querySelectorAll('.footprint');
                        for (const footprint of footprints) {
                            footnotecontent += footprint.outerHTML;
                            footprint.remove();
                        }
                        fullContent = document.documentElement.innerHTML;
                    } else if (dr["fullcontent"].toString().indexOf("<footnote>") !== -1) {
                        const regexfootnote = /<footnote>(.*?)<\/footnote>/gs;
                        const matchesfootnote = dr["fullcontent"].toString().match(regexfootnote);
                        if (matchesfootnote) {
                            for (const matchfoot of matchesfootnote) {
                                footnotecontent += matchfoot;
                            }
                        }
                        fullContent = dr["fullcontent"].toString().replace(regexfootnote, "");
                    } else {
                        fullContent = dr["fullcontent"].toString();
                    }
                    indexDocument.footnotecontent = footnotecontent;
                    // #endregion footnote

                    // #region remove header tag from full content
                    if (dr["fullcontent"].toString().indexOf("<header>") !== -1) {
                        fullContent = Common.RemovedHeaderTag(fullContent);
                    }
                    // #endregion

                    // #region xml meta tag
                    if (dr["fullcontent"].toString().indexOf("<header>") !== -1) {
                        indexDocument.xmltag = Common.GetMetaTag(dr["fullcontent"].toString());
                    } else {
                        indexDocument.xmltag = "";
                    }
                    // #endregion

                    indexDocument.fullcontent = fullContent.trim().lastIndexOf("</document>") !== -1 ? fullContent.trim().replace("</document>", "<div id='xmlmetadata' style='display:none;'>" + indexDocument.searchboosttext + "</div></document>") : fullContent.lastIndexOf("</html>") !== -1 ? fullContent.trim().replace("</html>", "<div id='htmmetadata' style='display:none;'>" + indexDocument.searchboosttext + "</div></html>") : fullContent.trim() + "<div id='nodata' style='display:none;'>" + indexDocument.searchboosttext + "</div>";

                    indexDocument.documentdate = dr["documentdate"].toString();
                    indexDocument.formatteddocumentdate = new Date(!!indexDocument.documentdate ? indexDocument.documentdate.substring(0, 10) : "1900-01-01");
                    indexDocument.created_date = new Date(!!dr["created_date"].toString() ? dr["created_date"].toString().substring(0, 19) : "1900-01-01");
                    const formatteddate: string = !!indexDocument.documentdate ? indexDocument.documentdate.substring(0, 10) : "1900-01-01";
                    indexDocument.updated_date = new Date(formatteddate);

                    indexDocument.ispublished = true;
                    indexDocument.lastpublished_date = new Date();
                    indexDocument.lastQCDate = new Date();
                    indexDocument.isshowonsite = true;
                    indexDocument.boostpopularity = 1000;
                    indexDocument.viewcount = 10;
                    indexDocumentList.push(indexDocument);
                    // #endregion



                } catch (ex) {
                    Common.LogError(ex, "mid = " + dr["mid"]);
                    console.log("error:" + dr["mid"] + ex.message);
                    Common.LogErrorId(dr["mid"].toString());
                }
            }
            console.log("Document Batch No completed:" + i + "\r\n");

            let status = '';

            // if (indexType === 1) {
            //     status = await BulkIndexing(indexDocumentList, 'x', IndexLocalPath, IndexName, IndexDocument, docType);
            // } else {
            //     status = await BulkIndexing(indexDocumentList, 'x', IndexLocalPath, IndexNameStopword, IndexDocument, docType);
            // }
        }
    }
}


async function NewsIndex(dt: any, docType: number, templateid: string): Promise<void> {
    let indexDocumentList: IndexDocument[] = [];
    const batchSize: number = 5000; // magic
    const totalBatches: number = Math.ceil(dt.Rows.Count / batchSize);
    console.log("Total Document Batch Started:" + totalBatches + "\r\n");
    for (let i = 0; i < totalBatches; i++) {
        console.log("Document Batch No started:" + i + "\r\n");
        const dataRows = dt.AsEnumerable().Skip(i * batchSize).Take(batchSize);
        if (dataRows.Count() > 0) {
            for (const dr of dataRows) {
                //console.log("log start for actid:" + dr["mid"]+ "\r\n");
                try {
                    const indexDocument: IndexDocument = {} as IndexDocument;
                    indexDocument.id = dr["mid"]?.trim();
                    indexDocument.mid = dr["id"]?.trim();
                    indexDocument.templateid = templateid;
                    indexDocument.documenttype = dr["documenttype"]?.toLowerCase().trim();
                    indexDocument.documentformat = dr["documentformat"]?.toLowerCase().trim();
                    indexDocument.filenamepath = dr["url"]?.trim();
                    if (dr["url"]?.toLowerCase().includes(".pdf")) {
                        indexDocument.filenamepath = new Common.UploadPdfFilesOnAmazonS3Bucket(indexDocument.id, indexDocument.filenamepath);
                    }
                    //indexDocument.filenamepath = new Common().pdfFileManagement(indexDocument.id, indexDocument.filenamepath, "");
                    //Common.UploadLinkFilesOnS3(indexDocument.id, "news");
                    Common.UploadLinkFilesOnS3Centax(indexDocument.mid, "news", indexDocument.documentformat, dr["url"]?.trim(), indexDocument.id);

                    //#region cat subcat binding

                    const catSubCatArray = (!!dr["categoriescentax"]) ? String(dr["categoriescentax"]).split('$') : null;
                    if (catSubCatArray !== null) {
                        const objCatList: Category[] = [];
                        for (const catsubcat of catSubCatArray) {
                            if (!!catsubcat) {
                                const objCat: Category = {} as Category;
                                const objSubCat: Subcategory = {} as Subcategory;
                                const isprimarycat = (catsubcat.split('%').length > 1) ? parseInt(catsubcat.split('%')[1]) : 0;
                                if (catsubcat.indexOf('|') > 0) {
                                    const catidname = (!!catsubcat) ? catsubcat.split('|') : null;
                                    const mainCat = catidname?.[1].trim().split('^')[0].trim();
                                    const isRequiredCategory = (mainCat?.includes("111050000000018392") || mainCat?.includes("111050000000018393") || mainCat?.includes("111050000000018400") || mainCat?.includes("111050000000018768") || mainCat?.includes("111050000000018769") || mainCat?.includes("111050000000018770") || mainCat?.includes("111050000000018771") || mainCat?.includes("111050000000018772") || mainCat?.includes("111050000000019031"));
                                    if (!isRequiredCategory) {
                                        continue;
                                    }
                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objCat.id = catidname?.[1].trim().split('^')[0].trim();
                                            objCat.name = catidname?.[1].split('^')[1].trim().split('%')[0];
                                            objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.competitionCategoryId:
                                            objCat.id = Constants.competitionCategoryId;
                                            objCat.name = Constants.competitionCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.tpCategoryId:
                                            objCat.id = Constants.tpCategoryId;
                                            objCat.name = Constants.tpCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        case Constants.iltCategoryId:
                                            objCat.id = Constants.iltCategoryId;
                                            objCat.name = Constants.iltCategory;
                                            objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                        default:
                                            objCat.id = catidname?.[0].trim().split('^')[0].trim();
                                            objCat.name = catidname?.[0].split('^')[1].trim().split('%')[0];
                                            objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                    }
                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objSubCat.id = catidname?.[2].trim().split('^')[0].trim();
                                            objSubCat.name = catidname?.[2].split('^')[1].trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                            break;
                                        case Constants.competitionCategoryId:
                                            objSubCat.id = Constants.competitionCategoryId;
                                            objSubCat.name = Constants.competitionCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.tpCategoryId:
                                            objSubCat.id = Constants.tpCategoryId;
                                            objSubCat.name = Constants.tpCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        case Constants.iltCategoryId:
                                            objSubCat.id = Constants.iltCategoryId;
                                            objSubCat.name = Constants.iltCategory;
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                        default:
                                            objSubCat.id = catidname?.[1].trim().split('^')[0].trim();
                                            objSubCat.name = catidname?.[1].split('^')[1].trim().split('%')[0];
                                            objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                            break;
                                    }
                                    objCat.subcategory = objSubCat;
                                } else {
                                    objCat.id = catsubcat.split('^')[0].trim();
                                    objCat.name = catsubcat.split('^')[1].trim().split('%')[0];
                                    objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                    objCat.isprimarycat = isprimarycat;

                                    objSubCat.id = "";
                                    objSubCat.name = "";
                                    objSubCat.url = "";
                                    objCat.subcategory = objSubCat;
                                }
                                objCatList.push(objCat);
                            }
                        }
                        indexDocument.categories = objCatList;
                    }
                    //#endregion

                    // #region Groups binding
                    const groupSubgroupArray = !!dr["groups"] ? dr["groups"].toString().split('|') : null;
                    if (groupSubgroupArray != null) {
                        const objGroups: Groups = {} as Groups;
                        const objSubGroup: Subgroup = {} as Subgroup;

                        if (groupSubgroupArray.length > 1 && !!groupSubgroupArray[1]) {
                            objSubGroup.id = groupSubgroupArray[1].split('^')[0].trim();
                            objSubGroup.name = groupSubgroupArray[1].split('^')[1].split('#')[0].trim();
                            objSubGroup.ordering = groupSubgroupArray[1].split('^')[1].split('#')[1].trim();
                            objSubGroup.url = Common.GetUrl(objSubGroup?.name?.toLowerCase());
                        }

                        const objSubSubGroup: Subsubgroup = {} as Subsubgroup;
                        if (groupSubgroupArray.length > 2 && groupSubgroupArray[2] !== "") {
                            objSubSubGroup.id = groupSubgroupArray[2].split('^')[0].trim();
                            objSubSubGroup.name = groupSubgroupArray[2].split('^')[1].split('#')[0].trim();
                            objSubSubGroup.ordering = groupSubgroupArray[2].split('^')[1].split('#')[1].trim();
                            objSubSubGroup.url = Common.GetUrl(objSubSubGroup?.name?.toLowerCase());
                        }

                        objSubGroup.subsubgroup = objSubSubGroup;

                        const group: Group = {
                            id: groupSubgroupArray[0].split('^')[0].trim(),
                            name: docType === 3 ? "form" : groupSubgroupArray[0].split('^')[1].split('#')[0].trim(),
                            url: docType === 3 ? "form" : Common.GetUrl(groupSubgroupArray[0].split('^')[1].split('#')[0].toLowerCase().trim()),
                            subgroup: objSubGroup
                        };

                        objGroups.group = group;
                        indexDocument.groups = objGroups;
                    }
                    // #endregion group binding

                    indexDocument.heading = dr["Heading"]?.toString();
                    indexDocument.subheading = dr["subheading"]?.toString().trim();
                    indexDocument.sortheading = dr["sortheading"]?.toString().toLowerCase().trim();
                    indexDocument.sortheadingnumber = dr["sortheadingnumber"]?.toString().toLowerCase().trim();
                    indexDocument.searchheadingnumber = dr["searchheadingnumber"]?.toString().toLowerCase().trim();
                    indexDocument.url = dr["url"]?.toString().toLowerCase().trim();
                    indexDocument.language = dr["language"]?.toString().toLowerCase().trim();

                    // #region marking info
                    const markinginfoArray = !!dr["MarkingInfo"] ? dr["MarkingInfo"].toString().split('$') : null;
                    let topStoryHeading = "";
                    let topStoryDesc = "";

                    if (markinginfoArray != null) {
                        const objMarkingInfoes: Markinginfo[] = [];
                        let num: number = 0;

                        markinginfoArray.forEach(markinginfo => {
                            num++;
                            const markings = markinginfo.split('|');

                            if (markings != null && markings.length > 1) {
                                const marking1 = markings[1].replace("&#39;", "'");
                                const markingInfo: Markinginfo = {} as Markinginfo;
                                markingInfo.number = num;
                                markingInfo.text = markings[0];
                                markingInfo.image = marking1.split('^')[0];

                                if (num === 1) {
                                    const topStoryParts = marking1.split('^')[1].split(new RegExp("##"));
                                    topStoryHeading = topStoryParts[0];
                                    topStoryDesc = topStoryParts[1]?.split(new RegExp("@@i"))[0] || topStoryParts[1];
                                }

                                if (marking1.indexOf("@@e") !== -1) {
                                    const entryUpdateParts = marking1.split('^')[1].split(new RegExp("##"))[1].split(new RegExp("@@i"))[1].split('~');
                                    markingInfo.entrydate = entryUpdateParts[1].split('\\')[0];
                                    markingInfo.updateddate = entryUpdateParts[1].replace('_', ' ').trim().split(new RegExp("@@e"))[0];
                                }

                                const pmark = marking1.indexOf("@@e") !== -1 ? marking1.split('^')[1].split(new RegExp("##"))[1].split(new RegExp("@@i"))[1].split('~')[1].split('\\')[1].replace('_', ' ').trim().split(new RegExp("@@e"))[1] : "";
                                const parentmark = marking1.indexOf("@@t") !== -1 ? pmark.split(new RegExp("@@t")) : null;

                                if (marking1.split('^')[1].indexOf("##") !== -1 && marking1.split('^')[1].indexOf('~') !== -1) {
                                    markingInfo.entrydate = marking1.split('^')[1].split(new RegExp("##"))[1].split(new RegExp("@@i"))[1].split('~')[1].split('\\')[0];
                                    markingInfo.updateddate = marking1.split('^')[1].split(new RegExp("##"))[1].split(new RegExp("@@i"))[1].split('~')[1].split('\\')[1].replace('_', ' ').trim().split(new RegExp("@@e"))[0];
                                }

                                if (parentmark != null) {
                                    markingInfo.parentmarking = Common.customTrimStart((parentmark[0] + ", " + parentmark[1]), ',');
                                }

                                objMarkingInfoes.push(markingInfo);
                            }
                        });

                        indexDocument.markinginfo = objMarkingInfoes;
                    } else {
                        indexDocument.markinginfo = [{ number: 0, text: "", image: "", entrydate: new Date().toLocaleDateString(), updateddate: new Date().toLocaleDateString() }];
                    }

                    indexDocument.topstoryheading = topStoryHeading;
                    indexDocument.topstorydesc = topStoryDesc;
                    // #endregion end marking info

                    // #region Tagging Info
                    const taggingInfo = !!dr["TagInfo"] ? dr["TagInfo"].toString().split('$') : null;
                    const objTags: Taginfo[] = [];

                    if (taggingInfo != null && taggingInfo.length > 0) {
                        for (const taginfo of taggingInfo) {
                            const taginfos = !!taginfo ? taginfo.toString().split('|') : null;
                            if (!!taginfo) {
                                const objtaginfo: Taginfo = {} as Taginfo;
                                objtaginfo.id = taginfos[1].split('^')[0];
                                objtaginfo.name = taginfos[1].split('^')[1];
                                objTags.push(objtaginfo);
                            }
                        }
                    } else {
                        const taginfos = !!dr["TagInfo"] ? dr["TagInfo"].toString().split('|') : null;
                        if (taginfos != null) {
                            const objtaginfo: Taginfo = {} as Taginfo;
                            objtaginfo.id = taginfos[1].split('^')[0];
                            objtaginfo.name = taginfos[1].split('^')[1];
                            objTags.push(objtaginfo);
                        }
                    }

                    indexDocument.taginfo = objTags;
                    // #endregion Tagging info end

                    indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(`${dr["categoriescentax"].toString().toLowerCase()} ${dr["groups"].toString().toLowerCase()} ${dr["Heading"].toString().trim()} ${dr["subheading"].toString().trim()}`);
                    indexDocument.shortcontent = dr["shortcontent"].toString().trim();

                    // #region footnote region
                    let fullContent = "";
                    let footnotecontent = "";

                    const dom = new JSDOM(dr["fullcontent"].toString());

                    const isHtmlFootnote = dom.window.document.querySelectorAll('.footprint').length > 0;

                    if (isHtmlFootnote && indexDocument.documentformat === ".htm") {
                        const footprintDivs = dom.window.document.querySelectorAll('.footprint');
                        footprintDivs.forEach(item => {
                            item.remove();
                            footnotecontent += item.outerHTML;
                        });
                        fullContent = dom.window.document.body.innerHTML;
                    } else if (dr["fullcontent"].toString().indexOf("<footnote>") !== -1) {
                        const regexfootnote = /<footnote>(.*?)<\/footnote>/g;
                        const matchesfootnote = dr["fullcontent"].toString().match(regexfootnote);

                        if (matchesfootnote) {
                            matchesfootnote.forEach(matchfoot => {
                                footnotecontent += matchfoot;
                            });
                        }

                        fullContent = dr["fullcontent"].toString().replace(regexfootnote, "");
                    } else {
                        fullContent = dr["fullcontent"].toString();
                    }

                    indexDocument.footnotecontent = footnotecontent;
                    // #endregion footnote
                    // ...

                    // #region remove header tag from full content
                    if (dr["fullcontent"].toString().indexOf("<header>") !== -1) {
                        fullContent = Common.RemovedHeaderTag(fullContent);
                    }
                    // #endregion

                    // #region xml meta tag
                    if (dr["fullcontent"].toString().indexOf("<header>") !== -1) {
                        indexDocument.xmltag = Common.GetMetaTag(dr["fullcontent"].toString());
                    } else {
                        indexDocument.xmltag = "";
                    }
                    // #endregion

                    indexDocument.fullcontent = fullContent.trim().lastIndexOf("</document>") !== -1
                        ? fullContent.trim().replace("</document>", `<div id='xmlmetadata' style='display:none;'>${indexDocument.searchboosttext}</div></document>`)
                        : fullContent.lastIndexOf("</html>") !== -1
                            ? fullContent.trim().replace("</html>", `<div id='htmmetadata' style='display:none;'>${indexDocument.searchboosttext}</div></html>`)
                            : fullContent.trim() + `<div id='nodata' style='display:none;'>${indexDocument.searchboosttext}</div>`;

                    indexDocument.documentdate = dr["documentdate"].toString().split('^')[0];
                    indexDocument.formatteddocumentdate = new Date(!!indexDocument.documentdate ? `${indexDocument.documentdate.substring(0, 4)}-${indexDocument.documentdate.substring(4, 2)}-${indexDocument.documentdate.substring(6, 2)}` : "1900-01-01");
                    indexDocument.created_date = new Date(!!dr["created_date"].toString() ? `${dr["created_date"].toString().substring(0, 4)}-${dr["created_date"].toString().substring(4, 2)}-${dr["created_date"].toString().substring(6, 2)} ${dr["created_date"].toString().substring(8, 2)}:${dr["created_date"].toString().substring(10, 2)}:${dr["created_date"].toString().substring(12, 2)}` : "1900-01-01");
                    const formatteddate = !!indexDocument.documentdate ? indexDocument.documentdate.toString() : "1900-01-01";
                    indexDocument.updated_date = new Date(!!dr["UpdatedDate"].toString() ? `${dr["UpdatedDate"].toString().substring(0, 4)}-${dr["UpdatedDate"].toString().substring(4, 2)}-${dr["UpdatedDate"].toString().substring(6, 2)} ${dr["UpdatedDate"].toString().substring(8, 2)}:${dr["UpdatedDate"].toString().substring(10, 2)}:${dr["UpdatedDate"].toString().substring(12, 2)}` : "1900-01-01");
                    indexDocument.ispublished = true;
                    indexDocument.lastpublished_date = new Date();
                    indexDocument.lastQCDate = new Date();
                    indexDocument.isshowonsite = true;
                    indexDocument.boostpopularity = 1000;
                    indexDocument.viewcount = 10;
                    indexDocumentList.push(indexDocument);

                    // ...

                } catch (ex) {
                    // Handle error
                    Common.LogError(ex, "mid = " + dr["mid"]);
                    console.log("error:" + dr["mid"] + ex.message);
                    Common.LogErrorId(dr["mid"].toString());
                }
            }
            console.log(`Document Batch No completed: ${i}`);

            let status = "";
            // if (indexType === 1) {
            //     status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexName, IndexDocument, docType);
            // } else {
            //     status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexNameStopword, IndexDocument, docType);
            // }
        }
    }
}

async function CaseFinderIndex(dt: any, docType: number, templateid: string): Promise<number> {
    let indexDocumentList: IndexDocument[] = [];
    const batchSize: number = 500; // magic
    const totalBatches: number = Math.ceil(dt.Rows.Count / batchSize);

    console.log("Total Document Batch Started:" + totalBatches + "\r\n");
    let reccount: number = 0;
    for (let i = 0; i < totalBatches; i++) {
        console.log("Document Batch No started:" + i + "\r\n");
        const dataRows = dt.AsEnumerable().slice(i * batchSize, (i + 1) * batchSize);
        if (dataRows.length > 0) {
            reccount = dataRows.length;
            for (const dr of dataRows) {
                const digestdocs: string[] | null = !!dr["DTDInfo"] ? dr["DTDInfo"].split('|') : null;
                if (digestdocs !== null) {
                    for (const doc of digestdocs) {
                        if (!!doc) {
                            //List<string> objSuggest = new List<string>();
                            // #region digest doc creation
                            //Console.Write("log start for actid:" + dr["mid"]+ "\r\n");
                            const dtdinfo: string[] = doc.split('@');

                            try {
                                // string[] subjects = digestmetatags[1].split('#');

                                const iltinfoes: string[] = dtdinfo[0].split('$');
                                const indexDocument: IndexDocument = {} as IndexDocument;
                                indexDocument.id = iltinfoes[0].trim();
                                indexDocument.mid = iltinfoes[0].trim();
                                indexDocument.templateid = templateid;
                                indexDocument.caseid = dr["mid"].toString().trim();
                                indexDocument.documenttype = "digest";
                                indexDocument.documentformat = dr["documentformat"].toString().toLowerCase().trim();
                                indexDocument.filenamepath = dr["url"].toString().trim();
                                const year: string = dr["year"].toString().trim();
                                if (!!year) {
                                    indexDocument.year = { id: year.trim(), name: year.trim() };
                                }
                                const objMasters: Masterinfo = {} as Masterinfo;
                                const objMasterInfo: Info = {} as Info;
                                const objAssociates: Associates = {} as Associates;

                                //#region act associations
                                const associationArray = !!dr["actassociations"] ? `${dr["actassociations"]}`.split('$') : null;
                                const objActs: GenericInfo[] = [];
                                const objSections: GenericInfo[] = [];

                                if (associationArray !== null && associationArray.length > 1) {
                                    for (const association of associationArray) {
                                        const associations = association.split('|');

                                        if (associations !== null && associations.length > 1) {
                                            const objAct: GenericInfo = {};
                                            const objSection: GenericInfo = {};

                                            const actidsecid = associations[0].indexOf('#') !== -1 ? `${associations[0]}`.trim().split('#') : null;
                                            const type = associations[0] !== "" ? associations[1].split('^')[0].toLowerCase() : "";

                                            if (type.trim() === "act") {
                                                if (!!associations[0]) {
                                                    if (Common.CasePopularActs.hasOwnProperty(`${associations[0]}`.trim())) {
                                                        const categories = Common.CasePopularActsfinal()[`${associations[0]}`.trim()][1].split(',');
                                                        objAct.id = `${associations[0]}`.trim();
                                                        objAct.type = type;
                                                        objAct.name = associations[1] !== "" ? associations[1].split('^')[1].split('~')[0] : "";
                                                        objAct.shortName = "";
                                                        objAct.ordering = associations[1].split('^')[1].split('~')[1];
                                                        objAct.orderInteger = 0;
                                                        objAct.url = Common.GetUrl(objAct.name.toLowerCase());
                                                        objAct.catUrls = categories;
                                                    } else {
                                                        const categories = Common.OtherActs()["999999999999999999"][1].split(',');
                                                        objAct.id = "999999999999999999";
                                                        objAct.type = type;
                                                        objAct.name = "Other Acts";
                                                        objAct.shortName = "";
                                                        objAct.ordering = "999999999";
                                                        objAct.orderInteger = 0;
                                                        objAct.url = Common.GetUrl(objAct.name.toLowerCase());
                                                        objAct.catUrls = categories;
                                                    }
                                                    objActs.push(objAct);
                                                }
                                            } else {
                                                let objSectionOrder: number;
                                                let section = associations[1] !== "" ? associations[1].split('^')[1] : "";
                                                if (!!section && !isNaN(parseInt(section.substring(0, 1)))) {
                                                    section = "Section - " + section;
                                                }
                                                if (!!actidsecid && !!actidsecid[1]) {
                                                    const sectionName = section.indexOf('~') !== -1 ? section.split('~')[0].trim() : section.trim();
                                                    if (!!sectionName) {
                                                        if (Common.CasePopularActs.hasOwnProperty(`${actidsecid[0]}`.trim())) {
                                                            objSection.id = actidsecid[1];
                                                            objSection.pid = actidsecid[0];
                                                            objSection.type = type;
                                                            objSection.name = sectionName;
                                                            objSection.shortName = "";
                                                            objSection.ordering = section.indexOf('~') !== -1 ? section.split('~')[1] : "";
                                                            objSection.orderInteger = 0;
                                                            objSection.url = Common.GetUrl(objSection.name.toLowerCase());
                                                        }
                                                        objSections.push(objSection);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                objMasterInfo.act = objActs;
                                objMasterInfo.section = objSections;
                                objMasters.info = objMasterInfo;
                                //#endregion
                                //#region cat subcat binding
                                const catSubCatArray = !!dr["categoriescentax"] ? dr["categoriescentax"].toString().split('$') : null;

                                if (catSubCatArray) {
                                    const objCatList: Category[] = [];

                                    for (const catsubcat of catSubCatArray) {
                                        if (!!catsubcat) {
                                            const objCat: Category = {} as Category;
                                            const objSubCat: Subcategory = {} as Subcategory;

                                            const isprimarycat: number = catsubcat.split('%').length > 1 ? parseInt(catsubcat.split('%')[1]) : 0;

                                            if (catsubcat.indexOf('|') > 0) {
                                                const catidname = catsubcat.split('|');
                                                const mainCat = catidname[1].trim().split('^')[0].trim();

                                                const isRequiredCategory =
                                                    mainCat.includes("111050000000018392") ||
                                                    mainCat.includes("111050000000018393") ||
                                                    mainCat.includes("111050000000018400") ||
                                                    mainCat.includes("111050000000018768") ||
                                                    mainCat.includes("111050000000018769") ||
                                                    mainCat.includes("111050000000018770") ||
                                                    mainCat.includes("111050000000018771") ||
                                                    mainCat.includes("111050000000018772") ||
                                                    mainCat.includes("111050000000019031");

                                                if (!isRequiredCategory) {
                                                    continue;
                                                }

                                                switch (mainCat) {
                                                    case Constants.femaCategoryId:
                                                    case Constants.companyCategoryId:
                                                        objCat.id = catidname[1].trim().split('^')[0].trim();
                                                        objCat.name = catidname[1].split('^')[1].trim().split('%')[0];
                                                        objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                                        objCat.isprimarycat = isprimarycat;
                                                        break;
                                                    case Constants.competitionCategoryId:
                                                        objCat.id = Constants.competitionCategoryId;
                                                        objCat.name = Constants.competitionCategory;
                                                        objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                                        objCat.isprimarycat = isprimarycat;
                                                        break;
                                                    case Constants.tpCategoryId:
                                                        objCat.id = Constants.tpCategoryId;
                                                        objCat.name = Constants.tpCategory;
                                                        objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                                        objCat.isprimarycat = isprimarycat;
                                                        break;
                                                    case Constants.iltCategoryId:
                                                        objCat.id = Constants.iltCategoryId;
                                                        objCat.name = Constants.iltCategory;
                                                        objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                                        objCat.isprimarycat = isprimarycat;
                                                        break;
                                                    default:
                                                        objCat.id = catidname[0].trim().split('^')[0].trim();
                                                        objCat.name = catidname[0].split('^')[1].trim().split('%')[0];
                                                        objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                                        objCat.isprimarycat = isprimarycat;
                                                        break;
                                                }

                                                switch (mainCat) {
                                                    case Constants.femaCategoryId:
                                                    case Constants.companyCategoryId:
                                                        objSubCat.id = catidname[2].trim().split('^')[0].trim();
                                                        objSubCat.name = catidname[2].split('^')[1].trim().split('%')[0];
                                                        objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                                        break;
                                                    case Constants.competitionCategoryId:
                                                        objSubCat.id = Constants.competitionCategoryId;
                                                        objSubCat.name = Constants.competitionCategory;
                                                        objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                                        break;
                                                    case Constants.tpCategoryId:
                                                        objSubCat.id = Constants.tpCategoryId;
                                                        objSubCat.name = Constants.tpCategory;
                                                        objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                                        break;
                                                    case Constants.iltCategoryId:
                                                        objSubCat.id = Constants.iltCategoryId;
                                                        objSubCat.name = Constants.iltCategory;
                                                        objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                                        break;
                                                    default:
                                                        objSubCat.id = catidname[1].trim().split('^')[0].trim();
                                                        objSubCat.name = catidname[1].split('^')[1].trim().split('%')[0];
                                                        objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                                        break;
                                                }

                                                objCat.subcategory = objSubCat;
                                            } else {
                                                objCat.id = catsubcat.split('^')[0].trim();
                                                objCat.name = catsubcat.split('^')[1].trim().split('%')[0];
                                                objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                                objCat.isprimarycat = isprimarycat;

                                                objSubCat.id = "";
                                                objSubCat.name = "";
                                                objSubCat.url = "";
                                                objCat.subcategory = objSubCat;
                                            }

                                            objCatList.push(objCat);
                                        }
                                    }

                                    indexDocument.categories = objCatList;
                                }

                                //#endregion

                                //#region group binding
                                const groupsArray = !!dr["groups"] ? dr["groups"].toString().replace('|', ' ').trim().split('^') : null;
                                if (groupsArray) {
                                    const objGroups: Groups = {
                                        group: {
                                            id: groupsArray[0].split('^')[0].trim(),
                                            name: groupsArray[1].trim(),
                                            url: Common.GetUrl(groupsArray[1].toLowerCase().trim()),
                                            subgroup: {
                                                id: "",
                                                name: "",
                                                subsubgroup: null,
                                                url: ""
                                            }
                                        }
                                    };
                                    indexDocument.groups = objGroups;
                                }
                                //#endregion

                                indexDocument.documentdate = dr["documentdate"].toString().split('^')[0];
                                indexDocument.heading = `${dr["heading"].toString().trim()}[${dr["documentdate"].toString().split('^')[1]}]`;
                                indexDocument.subheading = dr["subheading"].toString().trim();
                                indexDocument.sortheading = dr["sortheading"].toString().toLowerCase().trim();
                                indexDocument.sortbycourt = dr["sortbycourt"].toString().toLowerCase().trim();
                                indexDocument.sortbyname = dr["sortbyname"].toString().toLowerCase().trim();
                                indexDocument.sortbyauthor = dr["sortbyauthor"].toString().toLowerCase().trim();
                                indexDocument.sortheadingnumber = "";// dr["sortheadingnumber"].toString().toLowerCase().trim();
                                indexDocument.searchheadingnumber = dr["searchheadingnumber"].toString().toLowerCase().trim();
                                indexDocument.parentheadings = [{ id: "", name: "", ordering: "" }];
                                indexDocument.url = dr["url"].toString().toLowerCase().trim();
                                indexDocument.language = ""; // dr["language"].toString().toLowerCase().trim();

                                //#region Master Info
                                const objCourtInfoes: GenericInfo[] = [];
                                const courtInfo = dr["court"].toString().split('^');
                                if (courtInfo && courtInfo.length > 1) {
                                    if (!!courtInfo[0]) {
                                        const objCourtinfo: GenericInfo = {
                                            id: courtInfo[0].toString().trim(),
                                            type: "court",
                                            shortName: courtInfo[1].toString().trim(),
                                            name: courtInfo[2].toString().trim(),
                                            ordering: "",
                                            url: Common.GetUrl(courtInfo?.[2].toString().trim()?.toLowerCase())
                                        };
                                        objCourtInfoes.push(objCourtinfo);
                                    }
                                }
                                const objBenchinfoes: GenericInfo[] = [];
                                const benchInfo = dr["bench"].toString().split('^');
                                if (benchInfo && benchInfo.length > 1) {
                                    if (!!benchInfo[0]) {
                                        const objBenchinfo: GenericInfo = {
                                            id: benchInfo[0].toString().trim(),
                                            type: "bench",
                                            shortName: benchInfo[1].toString().trim(),
                                            name: benchInfo[2].toString().trim(),
                                            ordering: "",
                                            url: Common.GetUrl(benchInfo?.[2].toString().trim()?.toLowerCase())
                                        };
                                        objBenchinfoes.push(objBenchinfo);
                                    }
                                }
                                const benchTypeInfoes: GenericInfo[] = [];
                                const benchTypeInfo = dr["benchtype"].toString().split('^');
                                if (benchTypeInfo && benchTypeInfo.length > 1 && benchTypeInfo[0].length > 12) {
                                    if (!!benchTypeInfo[0]) {
                                        const objBenchTypeinfo: GenericInfo = {
                                            id: benchTypeInfo[0] ? benchTypeInfo[0].toString().trim() : "",
                                            type: "benchtype",
                                            shortName: benchTypeInfo[1] ? benchTypeInfo[1].toString().trim() : "",
                                            name: benchTypeInfo[2] ? benchTypeInfo[2].toString().trim() : "",
                                            ordering: "",
                                            url: benchTypeInfo[2] ? Common.GetUrl(benchTypeInfo?.[2].toString().trim().toLowerCase()) : ""
                                        }
                                        benchTypeInfoes.push(objBenchTypeinfo);
                                    }
                                }
                                const objInfavinfoes: GenericInfo[] = [];
                                const infavInfoes = !!dr["InfavourofText"] ? dr["InfavourofText"].toString().split('|') : null;
                                if (infavInfoes) {
                                    for (const infavof of infavInfoes) {
                                        const objInfavOf: GenericInfo = {
                                            id: infavof.split('^')[0],
                                            name: infavof.split('^')[1],
                                            shortName: "",
                                            type: "infavourof"
                                        };
                                        objInfavinfoes.push(objInfavOf);
                                    }
                                }

                                objMasterInfo.court = objCourtInfoes;
                                objMasterInfo.bench = objBenchinfoes;
                                objMasterInfo.benchtype = benchTypeInfoes;
                                objMasterInfo.infavourof = objInfavinfoes;
                                objMasters.info = objMasterInfo;
                                // indexDocument.masterinfo = objMasters;
                                //#endregion

                                //#region citation
                                const objCitations: Citation[] = [];

                                const searchCitation: FormattedCitation[] = [];

                                if (dr["citation"].toString().indexOf('$') !== -1) {
                                    const citationInfoes = !!dr["citation"] ? dr["citation"].toString().split('$') : null;
                                    if (citationInfoes) {
                                        for (const citationInfo of citationInfoes) {
                                            const objFormattedCitation: FormattedCitation = {};
                                            const objYear: citationinfo = {} as citationinfo;
                                            const objJournal: citationinfo = {} as citationinfo;
                                            const objVolume: citationinfo = {} as citationinfo;
                                            const objPage: citationinfo = {} as citationinfo;
                                            const yearJournalVolumePage = !!citationInfo ? citationInfo.split('|') : null;

                                            if (yearJournalVolumePage[0] !== null) {
                                                objYear.id = yearJournalVolumePage[0];
                                                objYear.name = yearJournalVolumePage[0];
                                                objYear.shortName = yearJournalVolumePage[0];
                                                objYear.ordering = yearJournalVolumePage[0];
                                                objYear.type = "year";
                                                objYear.url = Common.GetUrl(objYear.name);
                                            }
                                            // ... Similar conversion for other properties

                                            searchCitation.push({ name: objYear.name + objJournal.id + objVolume.name + objPage.name });
                                            objCitations.push({ year: objYear, journal: objJournal, volume: objVolume, pageno: objPage });
                                        }
                                    }
                                } else {
                                    const objCitation: Citation = {} as Citation;
                                    const objYear: citationinfo = {} as citationinfo;
                                    const objJournal: citationinfo = {} as citationinfo;
                                    const objVolume: citationinfo = {} as citationinfo;
                                    const objPage: citationinfo = {} as citationinfo;
                                    const objFormattedCitation: FormattedCitation = {};
                                    const yearJournalVolumePage = !!dr["citation"] ? dr["citation"].toString().split('|') : null;

                                    if (yearJournalVolumePage) {
                                        if (yearJournalVolumePage[0] !== null) {
                                            objYear.id = yearJournalVolumePage[0];
                                            objYear.name = yearJournalVolumePage[0];
                                            objYear.shortName = yearJournalVolumePage[0];
                                            objYear.ordering = yearJournalVolumePage[0];
                                            objYear.type = "year";
                                            objYear.url = Common.GetUrl(objYear.name);
                                        }
                                        // ... Similar conversion for other properties

                                        searchCitation.push({ name: objYear.name + objJournal.id + objVolume.name + objPage.name });
                                        objCitations.push({ year: objYear, journal: objJournal, volume: objVolume, pageno: objPage });
                                    }
                                }

                                objMasters.citations = objCitations;
                                indexDocument.masterinfo = objMasters;

                                const objSearchCit: SearchCitation = { formattedcitation: searchCitation };
                                indexDocument.searchcitation = objSearchCit;
                                //#endregion citation end

                                //#region OtherInfo Addition
                                const objOtherInfos: Otherinfo = {} as Otherinfo;
                                const objFullCitations: otherinfo[] = [];
                                const objJudges: otherinfo[] = [];
                                const objCounsels: otherinfo[] = [];
                                const objAppealNos: otherinfo[] = [];
                                const objAsstYrs: otherinfo[] = [];
                                const objParties: otherinfo[] = [];

                                if (!!dr["fullcitation"]) {
                                    const fullcitation = String(dr["fullcitation"]).trim().replace(/\|/g, '/');
                                    const objFullCitation: otherinfo = {
                                        id: "",
                                        name: fullcitation,
                                        shortName: "",
                                        type: "fullcitation"
                                    };
                                    objFullCitations.push(objFullCitation);

                                    const citations = !!dr["fullcitation"] ? String(dr["fullcitation"]).trim().split('|') : null;
                                    // if (citations) {
                                    //     for (const cit of citations) {
                                    //         if (!!cit) {
                                    //             objSuggest.push(cit.trim());
                                    //             objSuggest.push(cit.substring(cit.indexOf(" ")).trim());
                                    //         }
                                    //     }
                                    // }
                                }
                                const judgeNames = !!dr["judgename"] ? String(dr["judgename"]).split('|') : null;
                                if (judgeNames) {
                                    for (const judge of judgeNames) {
                                        const judgeParts = judge.split('^');
                                        const objJudge: otherinfo = {
                                            id: judgeParts[0],
                                            name: judgeParts[1],
                                            shortName: "",
                                            type: "judge"
                                        };
                                        objJudges.push(objJudge);
                                        // if (!!objJudge.name)
                                        //     objSuggest.push(objJudge.name.trim());
                                    }
                                }
                                const counselnameappellants = !!dr["counselnameappellant"] ? String(dr["counselnameappellant"]).split('|') : null;
                                if (counselnameappellants) {
                                    for (const counsel of counselnameappellants) {
                                        const counselParts = counsel.split('^');
                                        const objCounsel: otherinfo = {
                                            id: counselParts[0],
                                            name: counselParts[1],
                                            shortName: "",
                                            type: "counselnameappellant"
                                        };
                                        objCounsels.push(objCounsel);
                                        // if (!!objCounsel.name.trim())
                                        //     objSuggest.push(objCounsel.name.trim());
                                    }
                                }
                                const counselnamerespondents = !!dr["counselnamerespondent"] ? String(dr["counselnamerespondent"]).split('|') : null;
                                if (counselnamerespondents) {
                                    for (const counsel of counselnamerespondents) {
                                        const counselParts = counsel.split('^');
                                        const objCounsel: otherinfo = {
                                            id: counselParts[0],
                                            name: counselParts[1],
                                            shortName: "",
                                            type: "counselnamerespondent"
                                        };
                                        objCounsels.push(objCounsel);
                                        // if (!!objCounsel.name.trim())
                                        //     objSuggest.push(objCounsel.name.trim());
                                    }
                                }
                                const appealnos = !!dr["appealno"] ? String(dr["appealno"]).split('|') : null;
                                if (appealnos) {
                                    for (const appealno of appealnos) {
                                        const appealnoParts = appealno.split('^');
                                        const objappealno: otherinfo = {
                                            id: appealnoParts[0]?.trim() ?? appealno,
                                            name: appealnoParts[1]?.trim() ?? appealno,
                                            shortName: "",
                                            type: "appealno"
                                        };
                                        objAppealNos.push(objappealno);
                                        // if (!!objappealno.name.trim())
                                        //     objSuggest.push(objappealno.name.trim());
                                    }
                                }
                                const asstyrs = !!dr["asstyr"] ? String(dr["asstyr"]).split('|') : null;
                                if (asstyrs) {
                                    for (const asstyr of asstyrs) {
                                        if (!!asstyr) {
                                            const objasstyr: otherinfo = {
                                                id: asstyr,
                                                name: asstyr,
                                                shortName: "",
                                                type: "asstyr"
                                            };
                                            objAsstYrs.push(objasstyr);
                                            // if (!!objasstyr.name.trim())
                                            //     objSuggest.push(objasstyr.name.trim());
                                        }
                                    }
                                }
                                if (!!dr["partyname1"]) {
                                    const objparty1: otherinfo = {
                                        id: "",
                                        name: String(dr["partyname1"]),
                                        shortName: "",
                                        type: "partyname1"
                                    };
                                    objParties.push(objparty1);
                                    // if (!!objparty1.name.trim())
                                    //     objSuggest.push(objparty1.name.trim());
                                }
                                if (!!dr["partyname2"]) {
                                    const objparty2: otherinfo = {
                                        id: "",
                                        name: String(dr["partyname2"]),
                                        shortName: "",
                                        type: "partyname2"
                                    };
                                    objParties.push(objparty2);
                                    // if (!!objparty2.name.trim())
                                    //     objSuggest.push(objparty2.name.trim());
                                }
                                objOtherInfos.fullcitation = objFullCitations;
                                objOtherInfos.judge = objJudges;
                                objOtherInfos.counselname = objCounsels;
                                objOtherInfos.asstyr = objAsstYrs;
                                objOtherInfos.appealno = objAppealNos;
                                objOtherInfos.partyname = objParties;
                                indexDocument.otherinfo = objOtherInfos;
                                //#endregion OtherInfo Addition end

                                //#region iltinfo
                                const objIltInfoes: Iltinfo[] = [];
                                const searchIltCitation: FormattedCitation[] = [];
                                let countries = '';
                                let articles = '';
                                let subjects = '';

                                for (const iltinfo of iltinfoes) {
                                    if (iltinfo.indexOf('~') !== -1) {
                                        const digestmetatags = !!iltinfo ? iltinfo.split('^') : null;

                                        if (digestmetatags) {
                                            const objFormattedCitation: FormattedCitation = {};
                                            const objCountry1: iltinfo = {};
                                            const objCountry2: iltinfo = {};
                                            const objArticle: iltinfo = {};
                                            const objSubject: iltinfo = {};
                                            const objSubSubject: iltinfo = {};

                                            if (digestmetatags[0] !== null) {
                                                const country1Parts = digestmetatags[0].split('~');
                                                objCountry1.id = country1Parts[0];
                                                objCountry1.name = country1Parts[1];
                                                objCountry1.shortName = '';
                                                objCountry1.ordering = objCountry1.name.toLowerCase();
                                                objCountry1.type = 'country1';
                                                objCountry1.url = Common.GetUrl(objCountry1.name);
                                                countries += objCountry1.name.trim() + ' ';
                                                // if (!!objCountry1.name.trim())
                                                //     objSuggest.push(objCountry1.name.trim());
                                            }

                                            if (digestmetatags[1] !== null) {
                                                const country2Parts = digestmetatags[1].split('~');
                                                if (country2Parts[1].length > 15) {
                                                    objCountry2.id = country2Parts[0];
                                                    objCountry2.name = country2Parts[1];
                                                    objCountry2.shortName = '';
                                                    objCountry2.ordering = objCountry2.name.toLowerCase();
                                                    objCountry2.type = 'country2';
                                                    objCountry2.url = Common.GetUrl(objCountry2.name);
                                                } else {
                                                    objCountry2.id = '000000000000000000';
                                                    objCountry2.pid = objCountry1.id;
                                                    objCountry2.name = '';
                                                    objCountry2.shortName = '';
                                                    objCountry2.ordering = '';
                                                    objCountry2.type = 'country2';
                                                    objCountry2.url = Common.GetUrl(objCountry2.name);
                                                }
                                                countries += objCountry2.name.trim() + ' ';
                                                // if (!!objCountry2.name.trim())
                                                //     objSuggest.push(objCountry2.name.trim());
                                            }

                                            if (digestmetatags[2] !== null) {
                                                const articleParts = digestmetatags[2].split('~');
                                                if (articleParts[1].length > 15) {
                                                    objArticle.id = articleParts[0];
                                                    objArticle.name = articleParts[1].indexOf('#') !== -1 ? articleParts[1].split('#')[0] : articleParts[1];
                                                    if (objCountry1.id && objCountry2.id) objArticle.pid = objCountry1.id + objCountry2.id;
                                                    objArticle.shortName = '';
                                                    objArticle.ordering = articleParts[1].indexOf('#') !== -1 ? articleParts[1].split('#')[1] : '';
                                                    objArticle.type = 'article';
                                                    objArticle.url = Common.GetUrl(objArticle.name);
                                                } else {
                                                    objArticle.id = '000000000000000000';
                                                    objArticle.name = '';
                                                    if (objCountry1.id && objCountry2.id) objArticle.pid = objCountry1.id + objCountry2.id;
                                                    objArticle.shortName = '';
                                                    objArticle.ordering = '';
                                                    objArticle.type = 'article';
                                                    objArticle.url = '';
                                                }
                                                articles += objArticle.name.trim() + ' ';
                                                // if (!!objArticle.name.trim())
                                                //     objSuggest.push(objArticle.name.trim());
                                            }

                                            if (digestmetatags[3] !== null) {
                                                const subjectParts = digestmetatags[3].split('~');
                                                if (subjectParts[1].length > 15) {
                                                    objSubject.id = subjectParts[0];
                                                    objSubject.name = subjectParts[1];
                                                    if (objCountry1.id && objCountry2.id) objSubject.pid = objCountry1.id + objCountry2.id;
                                                    objSubject.pSubId = digestmetatags[5].split('~')[0];
                                                    objSubject.shortName = '';
                                                    objSubject.ordering = objSubject.name.toLowerCase();
                                                    objSubject.type = 'subject';
                                                    objSubject.url = Common.GetUrl(objSubject.name);
                                                } else {
                                                    objSubject.id = '000000000000000000';
                                                    objSubject.name = '';
                                                    if (objCountry1.id && objCountry2.id) objSubject.pid = objCountry1.id + objCountry2.id;
                                                    objSubject.pSubId = '';
                                                    objSubject.shortName = '';
                                                    objSubject.ordering = '';
                                                    objSubject.type = 'subject';
                                                    objSubject.url = '';
                                                }
                                                subjects += objSubject.name.trim() + ' ';
                                                // if (!!objSubject.name.trim())
                                                //     objSuggest.push(objSubject.name.trim());
                                            }

                                            if (digestmetatags[4] !== null) {
                                                const subSubjectParts = digestmetatags[4].split('~');
                                                if (subSubjectParts[1].length > 15) {
                                                    objSubSubject.id = subSubjectParts[0];
                                                    objSubSubject.name = subSubjectParts[1];
                                                    if (objCountry1.id && objCountry2.id) objSubSubject.pid = objCountry1.id + objCountry2.id;
                                                    objSubSubject.pSubId = digestmetatags[5].split('~')[0];
                                                    objSubSubject.shortName = '';
                                                    objSubSubject.ordering = objSubSubject.name.toLowerCase();
                                                    objSubSubject.type = 'subsubject';
                                                    objSubSubject.url = Common.GetUrl(objSubSubject.name);
                                                } else {
                                                    objSubSubject.id = '000000000000000000';
                                                    if (objCountry1.id && objCountry2.id) objSubSubject.pid = objCountry1.id + objCountry2.id;
                                                    objSubSubject.pSubId = '';
                                                    objSubSubject.name = '';
                                                    objSubSubject.shortName = '';
                                                    objSubSubject.ordering = '';
                                                    objSubSubject.type = 'subsubject';
                                                    objSubSubject.url = '';
                                                }
                                                subjects += objSubSubject.name.trim() + ' ';
                                                // if (!!objSubSubject.name.trim())
                                                //     objSuggest.push(objSubSubject.name.trim());
                                            }

                                            if (objCountry1.id && objCountry2.id) searchIltCitation.push({ name: objCountry1.id + objCountry2.id + objArticle.id + objSubject.id + objSubSubject.id });
                                            objIltInfoes.push({ country1: objCountry1, country2: objCountry2, article: objArticle, subject: objSubject, subsubject: objSubSubject });
                                        }
                                    }
                                }

                                // indexDocument.masterinfo = objMasters;
                                const objSearchIltCit: SearchIltCitation = { formattediltcitation: searchIltCitation };
                                indexDocument.searchiltcitation = objSearchIltCit;

                                objMasters.iltinfoes = objIltInfoes;
                                //#endregion iltinfo end

                                indexDocument.masterinfo = objMasters;
                                indexDocument.documenttypeboost = 0;
                                indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(
                                    `${dr["categoriescentax"]?.toString().toLowerCase() ?? ''} ${dr["groups"]?.toString().toLowerCase() ?? ''} ${dr["fullcitation"]?.toString().toLowerCase() ?? ''} ${dr["partyname1"]?.toString().toLowerCase() ?? ''} ${dr["partyname2"]?.toString().toLowerCase() ?? ''} appeal no ${dr["appealno"]?.toString().toLowerCase() ?? ''} ${Common.StringOnly(dr["counselnameappellant"])?.toString().toLowerCase() ?? ''} ${Common.StringOnly(dr["counselnamerespondent"])?.toString().toLowerCase() ?? ''} ${Common.StringOnly(dr["judgename"])?.toString().toLowerCase() ?? ''} ${dr["documentdate"]?.toString().toLowerCase() ?? ''} ${Common.StringOnly(dr["court"])?.toString().toLowerCase() ?? ''} ${Common.StringOnly(dr["bench"])?.toString().toLowerCase() ?? ''} ${Common.StringOnly(dr["benchtype"])?.toString().toLowerCase() ?? ''} ${Common.StringOnly(dr["InfavourofText"])?.toString().toLowerCase() ?? ''} ${Common.StringOnly(dr["actassociations"])?.toString().toLowerCase() ?? ''} ${dr["Heading"]?.toString().trim() ?? ''} ${dr["subheading"]?.toString().trim() ?? ''} ${countries ?? ''} ${articles ?? ''} ${subjects ?? ''}`
                                );
                                indexDocument.shortcontent = dr["shortcontent"]?.toString().trim() ?? '';
                                indexDocument.fullcontent = dtdinfo[1]?.split('^')[1] ?? '';
                                indexDocument.tldheading = dtdinfo[1]?.split('^')[0] ?? '';
                                //indexDocument.tldsubjects = digestmetatags[1]?.split('#')?.toArray();
                                //indexDocument.Suggest = objSuggest?.asEnumerable();
                                indexDocument.created_date = new Date(
                                    `${dr["created_date"]?.toString()?.substring(0, 4)}-${dr["created_date"]?.toString()?.substring(4, 2)}-${dr["created_date"]?.toString()?.substring(6, 2)} ${dr["created_date"]?.toString()?.substring(8, 2)}:${dr["created_date"]?.toString()?.substring(10, 2)}:${dr["created_date"]?.toString()?.substring(12, 2)}` || "1900-01-01"
                                );
                                const formatteddate = indexDocument.documentdate ? `${indexDocument.documentdate.substring(0, 4)}-${indexDocument.documentdate.substring(4, 2)}-${indexDocument.documentdate.substring(6, 2)}` : "1900-01-01";
                                indexDocument.updated_date = new Date(formatteddate);

                                indexDocument.ispublished = true;
                                indexDocument.lastpublished_date = new Date().toISOString().substring(0, 10);
                                indexDocument.lastQCDate = new Date().toISOString().substring(0, 10);
                                indexDocument.isshowonsite = true;
                                indexDocument.boostpopularity = 1000;

                                const filteredCategory: Category[] = [];
                                if (indexDocument.categories)
                                    for (const objCategory of indexDocument?.categories) {
                                        const isRequiredCategory = (objCategory.id === "111050000000018392" || objCategory.id === "111050000000018393" || objCategory.id === "111050000000018400");
                                        objCategory.name = objCategory?.name?.replace(/centax /gi, '');
                                        objCategory.name = objCategory?.name?.replace(/Centax /g, '');
                                        if (isRequiredCategory) {
                                            filteredCategory.push(objCategory);
                                        }
                                    }
                                indexDocument.categories = filteredCategory;

                                indexDocumentList.push(indexDocument);


                            } catch (ex) {
                                Common.LogError(ex, "mid = " + dr["mid"]);
                                console.log("error:" + dr["mid"] + ex.message);
                                Common.LogErrorId(dr["mid"]?.toString() ?? "");

                            }
                            //#endregion

                        }
                    }
                }
            }
            console.log("Document Batch No completed:" + i + "\r\n");
            // const status = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexName, IndexDocument, docType);
            //GC.Collect();

        }
    }
    return reccount;
}

async function AAAModelReportIndex(dt: any, docType: number, templateid: string): Promise<void> {
    let indexDocumentList: IndexDocument[] = [];
    const batchSize: number = 5000; // magic
    const totalBatches: number = Math.ceil(dt.Rows.Count / batchSize);
    console.log("Total Document Batch Started:" + totalBatches + "\r\n");
    for (let i = 0; i < totalBatches; i++) {
        console.log("Document Batch No started:" + i + "\r\n");
        const dataRows = dt.AsEnumerable().slice(i * batchSize, (i + 1) * batchSize);
        if (dataRows.length > 0) {
            for (const dr of dataRows) {
                try {
                    const indexDocument: IndexDocument = {} as IndexDocument;
                    indexDocument.id = `${dr["mid"]}`.trim();
                    indexDocument.mid = `${dr["id"]}`.trim();
                    indexDocument.templateid = templateid;
                    indexDocument.documenttype = `${dr["documenttype"]}`?.toLowerCase()?.trim();
                    indexDocument.documentformat = `${dr["documentformat"]}`?.toLowerCase()?.trim();
                    indexDocument.filenamepath = `${dr["url"]}`.trim();
                    if (dr["url"].toString().toLowerCase().includes(".pdf")) {
                        indexDocument.filenamepath = new Common.UploadPdfFilesOnAmazonS3Bucket(indexDocument.id, indexDocument.filenamepath);
                    }
                    let fullContent: string = "";
                    // #region remove header tag from full content
                    if (`${dr["fullcontent"]}`.includes("<header>")) {
                        fullContent = Common.RemovedHeaderTag(`${dr["fullcontent"]}`);
                    }
                    // #endregion
                    // #region xml meta tag
                    if (`${dr["fullcontent"]}`.includes("<header>")) {
                        indexDocument.xmltag = Common.GetMetaTag(`${dr["fullcontent"]}`);
                    } else {
                        indexDocument.xmltag = "";
                    }
                    // #endregion
                    indexDocument.fullcontent = fullContent;
                    // #region html data
                    if (!!dr["url"].toString()) {
                        const url: string = `${dr["url"]}` || "";
                        const filePath: string = System.Configuration.ConfigurationManager.AppSettings["FilePath"] + url.replace(" / ", "\\");
                        if (!!filePath.trim() && System.IO.File.Exists(filePath)) {
                            const fullcontent: string = System.IO.File.Exists(filePath) ? System.IO.File.ReadAllText(filePath, System.Text.Encoding.Default) : "";
                            indexDocument.fullcontent = fullcontent;
                        }
                    }
                    // #endregion

                    const yearidname = !!`${dr["year"]}` ? `${dr["year"]}`.split('^') : null;
                    if (yearidname !== null) {
                        indexDocument.year = { id: yearidname[0].trim(), name: yearidname[1].trim() };
                    } else {
                        indexDocument.year = { id: "", name: "" };
                    }

                    // #region category binding
                    const catSubCatArray = !!`${dr["categoriescentax"]}` ? `${dr["categoriescentax"]}`.split('$') : null;
                    if (catSubCatArray !== null) {
                        const objCatList: Category[] = [];
                        for (const catsubcat of catSubCatArray) {
                            if (!!catsubcat) {
                                const objCat: Category = {} as Category;
                                const objSubCat: Subcategory = {} as Subcategory;
                                const isprimarycat: number = catsubcat.split('%').length > 1 ? parseInt(catsubcat.split('%')[1]) : 0;
                                if (catsubcat.indexOf('|') > 0) {
                                    const catidname = !!catsubcat ? catsubcat.split('|') : null;
                                    if (catidname?.[1].trim().split('^')[0] === "111050000000017777" || catidname?.[1].trim().split('^')[0] === "111050000000017778") {
                                        objCat.id = catidname?.[1].trim().split('^')[0].trim();
                                        objCat.name = catidname?.[1].split('^')[1].trim().split('%')[0];
                                        objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                        objCat.isprimarycat = isprimarycat;
                                    } else {
                                        objCat.id = catidname?.[0].trim().split('^')[0].trim();
                                        objCat.name = catidname?.[0].split('^')[1].trim().split('%')[0];
                                        objCat.url = Common.GetUrl(objCat?.name?.toLowerCase());
                                        objCat.isprimarycat = isprimarycat;
                                    }
                                    if (catidname?.[1].trim().split('^')[0] === "111050000000017777" || catidname?.[1].trim().split('^')[0] === "111050000000017778") {
                                        objSubCat.id = catidname?.[2].trim().split('^')[0].trim();
                                        objSubCat.name = catidname?.[2].split('^')[1].trim().split('%')[0];
                                        objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                    } else {
                                        objSubCat.id = catidname?.[1].trim().split('^')[0].trim();
                                        objSubCat.name = catidname?.[1].split('^')[1].trim().split('%')[0];
                                        objSubCat.url = Common.GetUrl(objSubCat?.name?.toLowerCase());
                                    }
                                    objCat.subcategory = objSubCat;
                                } else {
                                    objCat.id = catsubcat.split('^')[0].trim();
                                    objCat.name = catsubcat.split('^')[1].trim().split('%')[0];
                                    objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                    objCat.isprimarycat = isprimarycat;

                                    objSubCat.id = "";
                                    objSubCat.name = "";
                                    objSubCat.url = "";
                                    objCat.subcategory = objSubCat;
                                }
                                objCatList.push(objCat);
                            }
                        }
                        indexDocument.categories = objCatList;
                    }

                    //#endregion category

                    // #region Groups binding
                    const groupSubgroupArray = !!`${dr["groups"]}` ? `${dr["groups"]}`.split('|') : null;

                    if (groupSubgroupArray !== null) {
                        const objGroups: Groups = {} as Groups;
                        const objSubGroup: Subgroup = {} as Subgroup;
                        if (groupSubgroupArray[1].indexOf('^') !== -1) {
                            objSubGroup.id = groupSubgroupArray[1].split('^')[0].trim();
                            objSubGroup.name = groupSubgroupArray[1].split('^')[1].split('#')[0].trim();
                            objSubGroup.ordering = groupSubgroupArray[1].split('^')[1].split('#')[1].trim();
                            objSubGroup.url = Common.GetUrl(objSubGroup.name.toLowerCase());
                        }
                        const objSubSubGroup: Subsubgroup = {} as Subsubgroup;
                        if (groupSubgroupArray.length > 2 && groupSubgroupArray[2] !== null && !!groupSubgroupArray[2]) {
                            objSubSubGroup.id = groupSubgroupArray[2].split('^')[0].trim();
                            objSubSubGroup.name = groupSubgroupArray[2].split('^')[1].split('#')[0].trim();
                            objSubSubGroup.ordering = groupSubgroupArray[2].split('^')[1].split('#')[1].trim();
                            objSubSubGroup.url = Common.GetUrl(objSubSubGroup.name.toLowerCase());
                        }
                        const objSubSubSubGroup: Subsubsubgroup = {} as Subsubsubgroup;
                        if (groupSubgroupArray.length > 3 && groupSubgroupArray[3] !== null && !!groupSubgroupArray[3]) {
                            objSubSubSubGroup.id = groupSubgroupArray[3].split('^')[0].trim();
                            objSubSubSubGroup.name = groupSubgroupArray[3].split('^')[1].split('#')[0].trim();
                            objSubSubSubGroup.ordering = groupSubgroupArray[3].split('^')[1].split('#')[1].trim();
                            objSubSubSubGroup.url = Common.GetUrl(objSubSubSubGroup.name.toLowerCase());
                        }
                        objSubSubGroup.subsubsubgroup = objSubSubSubGroup;
                        objSubGroup.subsubgroup = objSubSubGroup;
                        objGroups.group = {
                            id: groupSubgroupArray[0].split('^')[0].trim(),
                            name: groupSubgroupArray[0].split('^')[1].split('#')[0].trim(),
                            ordering: groupSubgroupArray[0].split('^')[1].split('#')[1].trim(),
                            url: Common.GetUrl(groupSubgroupArray[0].split('^')[1].split('#')[0].toLowerCase().trim()),
                            subgroup: objSubGroup
                        };
                        //objSubGroup.subsubgroup =[];
                        indexDocument.groups = objGroups;
                    }
                    // #endregion group binding

                    indexDocument.heading = `${dr["Heading"]}`;
                    indexDocument.subheading = `${dr["subheading"]}`.trim();
                    indexDocument.sortheading = "";//`${dr["sortheading"]}`.toLowerCase().trim();
                    indexDocument.sortheadingnumber = "0";

                    indexDocument.url = `${dr["url"]}`.toLowerCase().trim();
                    indexDocument.language = "";//`${dr["language"]}`.toLowerCase().trim();
                    x
                    // region master info
                    const objMasters: Masterinfo = {} as Masterinfo;
                    const objMasterInfo: Info = {} as Info;
                    const objCompanies: GenericInfo[] = [];
                    const objIndustries: GenericInfo[] = [];
                    const objAreas: GenericInfo[] = [];
                    const objClauses: GenericInfo[] = [];
                    const objOpinions: GenericInfo[] = [];
                    const objTopics: GenericInfo[] = [];
                    const companyIndustry = !!`${dr["associates"]}` ? `${dr["associates"]}`.split('|') : null;

                    if (companyIndustry && companyIndustry?.[1] !== "" && companyIndustry?.[1].length > 15) {
                        const objCompany: GenericInfo = {} as GenericInfo;
                        objCompany.id = companyIndustry?.[1].split('^')[0];
                        objCompany.name = companyIndustry?.[1].split('^')[1];
                        objCompany.ordering = objCompany?.name?.toLowerCase();
                        objCompany.url = Common.GetUrl(objCompany.name);
                        objCompanies.push(objCompany);
                    }
                    if (companyIndustry && companyIndustry?.[0] !== "" && companyIndustry?.[0]?.length > 15) {
                        const objIndustry: GenericInfo = {} as GenericInfo;
                        objIndustry.id = companyIndustry?.[0].split('^')[0];
                        objIndustry.name = companyIndustry?.[0].split('^')[1];
                        objIndustry.ordering = objIndustry?.name?.toLowerCase();
                        objIndustry.url = Common.GetUrl(objIndustry.name);
                        objIndustries.push(objIndustry);
                    }
                    const areainfo = !!`${dr["AreaID"]}` ? `${dr["AreaID"]}`.split('^') : null;

                    if (areainfo !== null && areainfo[0].length > 15) {
                        const objArea: GenericInfo = {} as GenericInfo;
                        objArea.id = areainfo[0];
                        objArea.name = areainfo[1].split('#')[0];
                        objArea.ordering = areainfo[1].split('#')[1];
                        objArea.url = Common.GetUrl(objArea.name);
                        objAreas.push(objArea);
                    }
                    const clauseinfo = !!`${dr["ClauseID"]}` ? `${dr["ClauseID"]}`.split('^') : null;

                    if (clauseinfo !== null && clauseinfo[0].length > 15) {
                        const objClause: GenericInfo = {} as GenericInfo;
                        objClause.id = clauseinfo[0];
                        objClause.name = clauseinfo[1].split('#')[0];
                        objClause.ordering = clauseinfo[1].split('#')[1];
                        objClause.url = Common.GetUrl(objClause.name);
                        objClauses.push(objClause);
                    }
                    const opinioninfo = !!`${dr["Opinion"]}` ? `${dr["Opinion"]}`.split('^') : null;

                    if (opinioninfo !== null && opinioninfo[0].length > 15) {
                        const objOpinion: GenericInfo = {} as GenericInfo;
                        objOpinion.id = opinioninfo[0];
                        objOpinion.name = opinioninfo[1].split('#')[0];
                        objOpinion.ordering = opinioninfo[1].split('#')[1];
                        objOpinion.url = Common.GetUrl(objOpinion.name);
                        objOpinions.push(objOpinion);
                    }
                    const topicinfo = !!`${dr["Topic"]}` ? `${dr["Topic"]}`.split('^') : null;

                    if (topicinfo !== null && topicinfo[0].length > 15) {
                        const objTopic: GenericInfo = {} as GenericInfo;
                        objTopic.id = topicinfo[0];
                        objTopic.name = topicinfo[1].split('#')[0];
                        objTopic.ordering = topicinfo[1].split('#')[1];
                        objTopic.url = Common.GetUrl(objTopic.name);
                        objTopics.push(objTopic);
                    }
                    objMasterInfo.area = objAreas;
                    objMasterInfo.clause = objClauses;
                    objMasterInfo.company = objCompanies;
                    objMasterInfo.industry = objIndustries;
                    objMasterInfo.opinions = objOpinions;
                    objMasterInfo.topics = objTopics;

                    objMasters.info = objMasterInfo;
                    indexDocument.masterinfo = objMasters;
                    // endregion

                    indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(`${dr["categoriescentax"]}`.toLowerCase() + " " + `${dr["groups"]}`.toLowerCase() + " " + Common.StringOnly(`${dr["year"]}`).toLowerCase() + " " + Common.StringOnly(`${dr["associates"]}`).toLowerCase() + " " + Common.StringOnly(`${dr["AreaID"]}`).toLowerCase() + " " + Common.StringOnly(`${dr["ClauseID"]}`).toLowerCase() + Common.StringOnly(`${dr["Heading"]}`).toLowerCase() + " " + `${dr["subheading"]}`.toLowerCase());
                    indexDocument.shortcontent = "";

                    indexDocument.documentdate = `${dr["documentdate"]}`.split('^')[0];
                    indexDocument.formatteddocumentdate = new Date(!`${indexDocument.documentdate}` ? `${indexDocument.documentdate}`.substring(0, 4) + "-" + `${indexDocument.documentdate}`.substring(4, 2) + "-" + `${indexDocument.documentdate}`.substring(6, 2) : "1900-01-01");
                    indexDocument.created_date = new Date(!`${dr["created_date"]}` ? `${dr["created_date"]}`.substring(0, 4) + "-" + `${dr["created_date"]}`.substring(4, 2) + "-" + `${dr["created_date"]}`.substring(6, 2) + " " + `${dr["created_date"]}`.substring(8, 2) + ":" + `${dr["created_date"]}`.substring(10, 2) + ":" + `${dr["created_date"]}`.substring(12, 2) : "1900-01-01");
                    const formatteddate = !`${indexDocument.documentdate}` ? `${indexDocument.documentdate}`.substring(0, 4) + "-" + `${indexDocument.documentdate}`.substring(4, 2) + "-" + `${indexDocument.documentdate}`.substring(6, 2) : "1900-01-01";
                    indexDocument.updated_date = new Date(formatteddate);

                    indexDocument.ispublished = true;
                    indexDocument.lastpublished_date = new Date(new Date().toISOString().split('T')[0]);
                    indexDocument.lastQCDate = new Date(new Date().toISOString().split('T')[0]);
                    indexDocument.isshowonsite = true;
                    indexDocument.boostpopularity = 10;
                    indexDocument.viewcount = 10;
                    indexDocumentList.push(indexDocument);
                    // Console.Write("log end for actid:" + dr["mid"]);
                    // WriteLog.InsertLogMsg("log end for actid:" + dr["mid"]);

                } catch (ex) {
                    Common.LogError(ex, "mid = " + `${dr["mid"]}`);
                    console.log("error:" + `${dr["mid"]}` + ex.message);
                    Common.LogErrorId(`${dr["mid"]}`);

                }
            }
            console.log("Document Batch No completed:" + i);
            // const status: string = await BulkIndexing(indexDocumentList, "x", IndexLocalPath, IndexName, IndexDocument, docType);
        }
    }
}


// }
