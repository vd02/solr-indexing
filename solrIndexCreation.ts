import { Common } from './common';
import { Constants } from './constants';
import { Associate, Associates, Category, CompletionField, GenericInfo, IndexDocument, Info, Masterinfo, Subcategory, casections, ca2013section, Groups, Subgroup, Group, Citation, FormattedCitation, citationinfo, SearchCitation, Otherinfo, otherinfo, SearchIltCitation, Iltinfo, iltinfo, Taginfo, Markinginfo, Headnote } from './indexDocument';
async function CaseLawsIndex(dt: any, docType: number, templateid: string): Promise<number> {
    const indexDocumentList: IndexDocument[] = [];
    const batchSize = 100; // magic
    const totalBatches = Math.ceil(dt.length / batchSize);
    console.log("Total Document Batch Started:" + totalBatches);
    let reccount = 0;

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
                    const indexDocument: IndexDocument = {} as IndexDocument;
                    indexDocument.id = dr['mid'].toString().trim();
                    indexDocument.mid = dr['id'].toString().trim();
                    indexDocument.excusdocid = dr['excusdocid'].toString().trim();
                    indexDocument.templateid = templateid;
                    indexDocument.documenttype = dr['documenttype'].toString().toLowerCase().trim();
                    indexDocument.documentformat = dr['documentformat'].toString().toLowerCase().trim();
                    indexDocument.filenamepath = dr['url'].toString().trim();

                    // Check if the filenamepath is a PDF and upload to Amazon S3
                    if (dr['url'].toString().toLowerCase().indexOf('.pdf') !== -1) {
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
                        console.error('S3 upload error for MID = ' + dr['mid'], ex);
                    }

                    // Check and set the year property
                    const year: string = dr['year'].toString().trim();
                    if (year !== '') {
                        indexDocument.year = { id: year, name: year };
                    }

                    const objMasters: Masterinfo = {} as Masterinfo;
                    const objMasterInfo: Info = {} as Info;
                    const objAssociates: Associates = {} as Associates;

                    const caseSubjectArray: string[] | null = dr['CaseSubject']
                        ? dr['CaseSubject'].toString().split('$')
                        : null;

                    const objsubjects: GenericInfo[] = [];

                    //#region subject-master
                    if (caseSubjectArray !== null && caseSubjectArray.length > 1) {
                        for (const association of caseSubjectArray) {
                            const associations: string[] = association.split('|');

                            if (associations !== null && associations.length > 1) {
                                const objSubject: GenericInfo = {} as GenericInfo;
                                const type: string = associations[0] !== '' ? associations[1].split('^')[0].toLowerCase() : '';

                                if (type.trim() === 'subject') {
                                    if (typeof associations[0] === 'string' && associations[0].trim() !== '') {
                                        objSubject.id = associations[0].trim();
                                        objSubject.type = type;
                                        objSubject.name = associations[1] !== '' ? associations[1].split('^')[1].split('~')[0] : '';
                                        objSubject.shortName = '';
                                        objSubject.ordering = associations[1].split('^')[1].split('~')[1];
                                        objSubject.orderInteger = 0;
                                        objSubject.url = Common.GetUrl(objSubject.name.toLowerCase());

                                        // Assuming objSubject.catUrls is a property of the GenericInfo class
                                        // Update this part accordingly based on the implementation of the GenericInfo class.
                                        // objSubject.catUrls = Common.CasePopularActs()[associations[0].trim()][1].split(',');

                                        objsubjects.push(objSubject);

                                        if (!!objSubject.name.trim()) {
                                            objSuggest.push({
                                                Input: [objSubject.name.toLowerCase().trim()],
                                                Weight: 18,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                    //#endregion subject-master

                    //#region cat-subcat-binding
                    const catSubCatArray: string[] = dr["categoriescentax"]
                        ? dr["categoriescentax"].toString().split("$")
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

                                    mainCat = mainCat.replace(/centax /gi, "");

                                    if (!isRequiredCategory) continue;

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objCat.id = catidname?.[1].trim().split("^")[0].trim();
                                            objCat.name = catidname?.[1].split("^")[1].trim().split("%")[0];
                                            if (objCat && objCat?.name) { objCat.url = Common.GetUrl(objCat.name.toLowerCase()); }
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
                                            if (catidname && catidname[0]) {
                                                objCat.id = catidname[0].trim().split("^")[0].trim();
                                                objCat.name = catidname[0].split("^")[1].trim().split("%")[0];
                                                objCat.url = Common.GetUrl(objCat.name.toLowerCase());
                                            }
                                            objCat.isprimarycat = isprimarycat;
                                            break;
                                    }

                                    switch (mainCat) {
                                        case Constants.femaCategoryId:
                                        case Constants.companyCategoryId:
                                            objSubCat.id = catidname[2].trim().split("^")[0].trim();
                                            objSubCat.name = catidname[2].split("^")[1].trim().split("%")[0];
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
                                            objSubCat.id = catidname[1].trim().split("^")[0].trim();
                                            objSubCat.name = catidname[1].split("^")[1].trim().split("%")[0];
                                            objSubCat.url = Common.GetUrl(objSubCat.name.toLowerCase());
                                            break;
                                    }

                                    objCat.subcategory = objSubCat;
                                } else {
                                    objCat.id = catsubcat.split("^")[0].trim();
                                    objCat.name = catsubcat.split("^")[1].trim().split("%")[0];
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
                                const type = associations[1] !== "" ? associations[1].split('^')[0].toLowerCase() : "";

                                if (type.toLowerCase().trim() === "act") {
                                    if (Common.CasePopularActsfinal().hasOwnProperty(associations[0].trim())) {
                                        const categories = Common.CasePopularActsfinal()[associations[0].trim()][1].split(',');
                                        objAct.id = objActAssociate.id = associations[0].trim();
                                        objAct.type = objActAssociate.type = type;
                                        objAct.name = objActAssociate.name = associations[1] !== "" ? associations[1].split('^')[1].split('~')[0] : "";
                                        objAct.shortName = "";
                                        objAct.ordering = associations[1].split('^')[1].split('~')[1];
                                        objAct.orderInteger = 0;
                                        objActAssociate.associatedDocid = "";
                                        objAct.url = objActAssociate.url = Common.GetUrl(objActAssociate.name.toLowerCase());
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
                                        objActAssociate.id = associations[0].trim();
                                        objActAssociate.type = type;
                                        objActAssociate.name = associations[1] !== "" ? associations[1].split('^')[1].split('~')[0] : "";
                                        objActAssociate.ordering = associations[1].split('^')[1].split('~')[1];
                                        objActAssociate.associatedDocid = "";
                                        objActAssociate.url = Common.GetUrl(objActAssociate.name.toLowerCase());
                                    }

                                    if (objAct.name.trim() !== "") {
                                        objSuggest.push({
                                            Input: [objAct.name.toLowerCase().trim()],
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
                                                    objSectionAssociate.id = parentsectionidname[0].replace('#', ' ').trim();
                                                    objSectionAssociate.name = parentsectionidname[1].replace('^', '-').split('~')[0];
                                                    objSectionAssociate.ordering = parentsectionidname[1].replace('^', '-').split('~')[1];
                                                    objSectionAssociate.actsectionid = actidsecid[0].trim() + parentsectionidname[0].replace('#', ' ').trim();
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
                                                objSection.url = Common.GetUrl(objSection.name.toLowerCase());

                                                if (!isparentsection) {
                                                    objSectionAssociate.id = actidsecid[1];
                                                    objSectionAssociate.name = sectionName;
                                                    objSectionAssociate.ordering = section.indexOf('~') !== -1 ? section.split('~')[1] : "";
                                                    objSectionAssociate.actsectionid = actidsecid[0].trim() + actidsecid[1].trim();
                                                }

                                                objSectionAssociate.type = type;
                                                objSectionAssociate.associatedDocid = actidsecid[0];
                                                objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name.toLowerCase());
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
                                                    objSectionAssociate.url = Common.GetUrl(objSectionAssociate.name.toLowerCase());
                                                }
                                            }

                                            if (objSection.name.trim() !== "") {
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
                                    obj1956section.name = ca1956actsection[3].trim().replace(' ', '-');
                                    obj1956section.actname = "Companies Act, 1956";
                                    obj1956section.url = Common.GetUrl(obj1956section.name.toLowerCase());
                                }

                                const obj2013sections: ca2013section[] = [];

                                for (const actsection of caactssections) {
                                    const actsections = actsection.split('^');

                                    if (actsection.indexOf("102010000000000793") !== -1) {
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
                    // indexDocument.associates = objAssociates;
                    objMasterInfo.act = objActs;
                    objMasterInfo.section = objSections;
                    objMasterInfo.subject = objsubjects;
                    objMasters.info = objMasterInfo;
                    //#endregion

                    //#region article-subject-binding
                    const objSubjectAssociations: Associate[] = [];
                    const associatesStr = dr["associates"].toString();

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

                    //#region rule associations
                    const ruleAssociationArray = (dr["DDA_Rules"] !== null && dr["DDA_Rules"] !== undefined && dr["DDA_Rules"].toString() !== "")
                        ? dr["DDA_Rules"].toString().split('$')
                        : null;

                    if (ruleAssociationArray !== null && ruleAssociationArray.length > 1) {
                        const objRuleAssociations: Associate[] = [];
                        const objRuleNoAssociations: Associate[] = [];

                        for (const association of ruleAssociationArray) {
                            const associations = association.split('|');

                            if (associations !== null && associations.length > 1) {
                                const objRuleAssociate: Associate = {} as Associate;
                                const objRulenoAssociate: Associate = {} as Associate;

                                const ruleidrulenoid = (associations[0].toString().indexOf('#') !== -1)
                                    ? associations[0].toString().trim().split('#')
                                    : null;

                                const type = (associations[0] !== "") ? associations[1].split('^')[0].toLowerCase() : "";

                                if (type.toLowerCase().trim() === "rule") {
                                    if (associations[0] !== "") {
                                        objRuleAssociate.id = associations[0].trim();
                                        objRuleAssociate.type = type;
                                        objRuleAssociate.name = (associations[1] !== "") ? associations[1].split('^')[1] : "";
                                        objRuleAssociate.associatedDocid = "";
                                        objRuleAssociate.url = Common.GetUrl(objRuleAssociate.name.toLowerCase());
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

                    //#region case referred associations 

                    const casereferredAssociation = (dr["casereferred"] !== null && dr["casereferred"] !== undefined && dr["casereferred"].toString() !== "")
                        ? dr["casereferred"].toString().split('$')
                        : null;

                    if (casereferredAssociation !== null && casereferredAssociation.length > 1) {
                        const objCaseReferredAssociations: Associate[] = [];

                        for (const association of casereferredAssociation) {
                            const associations = association.split('^');

                            if (associations !== null && associations.length > 1) {
                                const objCaseRefAssociate: Associate = {} as Associate; // Initialize as an empty object of type Associate

                                const idtype = (associations[0].toString().indexOf('|') !== -1)
                                    ? associations[0].toString().trim().split('|')
                                    : null;

                                const namedate = (associations[1].toString().indexOf('#') !== -1)
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

                                    objCaseRefAssociate.associatedDocid = indexDocument.mid;
                                    objCaseRefAssociate.url = Common.GetUrl(objCaseRefAssociate.name.toLowerCase());
                                    objCaseReferredAssociations.push(objCaseRefAssociate);
                                }
                            }
                        }

                        objAssociates.casereferred = objCaseReferredAssociations;
                    }


                    //#endregion

                    //#region case referred associations

                    const affirmreverseAssociation = (!!(dr["arinfo"]))
                        ? dr["arinfo"].toString().split('$')
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

                                    objaffirmReverseAssociate.url = Common.GetUrl(objaffirmReverseAssociate.name.toLowerCase());
                                    objaffirmreverseAssociations.push(objaffirmReverseAssociate);
                                }
                            }
                        }

                        objAssociates.affirmreverse = objaffirmreverseAssociations;
                    }

                    //#endregion

                    //#region case referred associations

                    const slpAssociation = (dr["slpinfo"] !== null && dr["slpinfo"] !== undefined && dr["slpinfo"].toString() !== "")
                        ? dr["slpinfo"].toString().split('$')
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
                                    objslpAssociate.url = Common.GetUrl(objslpAssociate.name.toLowerCase());
                                    slpAssociations.push(objslpAssociate);
                                }
                            }
                        }

                        objAssociates.slp = slpAssociations;
                    }


                    //#endregion

                    //#region cirnot association

                    const cirnotAssociation = (dr["DDA_CirNot"] !== null && dr["DDA_CirNot"] !== undefined && dr["DDA_CirNot"].toString().trim() !== "")
                        ? dr["DDA_CirNot"].toString().split('$')
                        : null;


                    if (cirnotAssociation !== null && cirnotAssociation.length > 1) {
                        const objcirnotAssociations: Associate[] = [];

                        for (const association of cirnotAssociation) {
                            const objcirnotAssociate: Associate = {} as Associate;

                            const associations = association.split('|');
                            if (associations !== null && associations.length > 1) {
                                objcirnotAssociate.id = associations[0].trim();
                                objcirnotAssociate.type = associations[1].split('^')[0].trim().toLowerCase();
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

                    //#region Groups Section
                    const groupsArray = (dr["groups"] !== null && dr["groups"] !== undefined && dr["groups"].toString().trim() !== "")
                        ? dr["groups"].toString().replace('|', ' ').trim().split('^')
                        : null;


                    if (groupsArray !== null) {
                        const objGroups: Groups = {} as Groups;
                        objGroups.group = {
                            id: groupsArray[0].split('^')[0].trim(),
                            name: groupsArray[1].trim(),
                            url: Common.GetUrl(groupsArray[1].toLowerCase().trim()),
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
                        ? dr["MasterCitationOrder"].toString().split('|')
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
                            objJournalsort.ordering = idName[1].toLowerCase();
                            objJournalsort.type = "journal";
                            objJournalsort.url = Common.GetUrl(objJournalsort.name);
                            // objCitation.journal = objJournalsort;
                        }
                        if (yearJournalVolumePageMaster[2] !== null) {
                            objVolumesort.id = yearJournalVolumePageMaster[2];
                            objVolumesort.name = (!!yearJournalVolumePageMaster[2])
                                ? parseInt(yearJournalVolumePageMaster[2].trim(), 10).toString().padStart(4, '0')
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
                        ? dr["MasterCitationOrderCentax"].toString().split('|')
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
                            objJournalsortcentax.ordering = idName[1].toLowerCase();
                            objJournalsortcentax.type = "journal";
                            objJournalsortcentax.url = Common.GetUrl(objJournalsort.name);
                            //objCitationsortcentax.journal = objJournalsort;
                        }
                        if (yearJournalVolumePageMastercentax[2] !== null) {
                            objVolumesortcentax.id = yearJournalVolumePageMastercentax[2];
                            objVolumesortcentax.name = (!yearJournalVolumePageMastercentax[2])
                                ? Number(yearJournalVolumePageMastercentax[2].trim()).toString().padStart(4, '0')
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

                    const yearJournalVolumePageMastercentaxelt: string[] | null = dr["MasterCitationOrderCentaxElt"] !== null && dr["MasterCitationOrderCentaxElt"] !== undefined && dr["MasterCitationOrderCentaxElt"].toString() !== ""
                        ? dr["MasterCitationOrderCentaxElt"].toString().split('|')
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
                            objJournalsortcentaxelt.ordering = idName[1].toLowerCase();
                            objJournalsortcentaxelt.type = "journal";
                            objJournalsortcentaxelt.url = Common.GetUrl(objJournalsortcentaxelt.name);
                        }

                        if (yearJournalVolumePageMastercentaxelt[2] !== null) {
                            objVolumesortcentaxelt.id = yearJournalVolumePageMastercentaxelt[2];
                            objVolumesortcentaxelt.name = yearJournalVolumePageMastercentaxelt[2].trim() !== "" ? Number(yearJournalVolumePageMastercentaxelt[2].trim()).toString().padStart(4, '0') : Common.getRepeat("?", 4);
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

                    const yearJournalVolumePageMastercentaxgstl: string[] | null = dr["MasterCitationOrderCentaxGstl"] !== null && dr["MasterCitationOrderCentaxGstl"] !== undefined && dr["MasterCitationOrderCentaxGstl"].toString() !== ""
                        ? dr["MasterCitationOrderCentaxGstl"].toString().split('|')
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
                            objJournalsortcentaxgstl.ordering = idName[1].toLowerCase();
                            objJournalsortcentaxgstl.type = "journal";
                            objJournalsortcentaxgstl.url = Common.GetUrl(objJournalsortcentaxgstl.name);
                        }

                        if (yearJournalVolumePageMastercentaxgstl[2] !== null) {
                            objVolumesortcentaxgstl.id = yearJournalVolumePageMastercentaxgstl[2];
                            objVolumesortcentaxgstl.name = yearJournalVolumePageMastercentaxgstl[2].trim() !== "" ? Number(yearJournalVolumePageMastercentaxgstl[2].trim()).toString().padStart(4, '0') : Common.getRepeat("?", 4);
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

                    const yearJournalVolumePageMastercentaxstr: string[] | null = dr["MasterCitationOrderCentaxStr"] !== null && dr["MasterCitationOrderCentaxStr"] !== undefined && dr["MasterCitationOrderCentaxStr"].toString() !== ""
                        ? dr["MasterCitationOrderCentaxStr"].toString().split('|')
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
                            objJournalsortcentaxstr.ordering = idName[1].toLowerCase();
                            objJournalsortcentaxstr.type = "journal";
                            objJournalsortcentaxstr.url = Common.GetUrl(objJournalsort.name);
                        }

                        if (yearJournalVolumePageMastercentaxstr[2] !== null) {
                            objVolumesortcentaxstr.id = yearJournalVolumePageMastercentaxstr[2];
                            objVolumesortcentaxstr.name = yearJournalVolumePageMastercentaxstr[2].trim() !== "" ? Number(yearJournalVolumePageMastercentaxstr[2].trim()).toString().padStart(4, '0') : Common.getRepeat("?", 4);
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

                    indexDocument.companyactinfo = obj1956sections;
                    indexDocument.documentdate = !!dr["documentdate"].toString().split('^')[0] ? dr["documentdate"].toString().split('^')[0] : "19000101";
                    indexDocument.formatteddocumentdate = new Date(!!indexDocument.documentdate ? indexDocument.documentdate.substring(0, 4) + "-" + indexDocument.documentdate.substring(4, 2) + "-" + indexDocument.documentdate.substring(6, 2) : "1900-01-01");
                    indexDocument.displaydocumentdatestring = !!indexDocument.documentdate && indexDocument.documentdate.trim() !== "19000101" ? indexDocument.documentdate : "";
                    indexDocument.heading = !!indexDocument.documentdate && indexDocument.documentdate.trim() !== "19000101" ? `${dr["heading"].toString().trim()}[${dr["documentdate"].toString().split('^')[1]}]` : dr["heading"].toString().trim();
                    indexDocument.subheading = dr["subheading"].toString().trim();
                    indexDocument.sortheading = dr["sortheading"].toString().toLowerCase().trim();
                    indexDocument.sortbycourt = dr["sortbycourt"].toString().toLowerCase().trim();
                    indexDocument.sortbyname = dr["sortbyname"].toString().toLowerCase().trim();
                    indexDocument.sortbyauthor = dr["sortbyauthor"].toString().toLowerCase().trim();
                    indexDocument.sortbycitation = objYearsort.name + objJournalsort.id + objVolumesort.name + objPagesort.name;
                    indexDocument.sortbycitationcentax = objYearsortcentax.name + objJournalsortcentax.id + objVolumesortcentax.name + objPagesortcentax.name;
                    indexDocument.sortbycitationcentaxelt = objYearsortcentaxelt.name + objJournalsortcentaxelt.id + objVolumesortcentaxelt.name + objPagesortcentaxelt.name;
                    indexDocument.sortbycitationcentaxgstl = objYearsortcentaxgstl.name + objJournalsortcentaxgstl.id + objVolumesortcentaxgstl.name + objPagesortcentaxgstl.name;
                    indexDocument.sortbycitationcentaxstr = objYearsortcentaxstr.name + objJournalsortcentaxstr.id + objVolumesortcentaxstr.name + objPagesortcentaxstr.name;
                    indexDocument.sortheadingnumber = "";
                    indexDocument.searchheadingnumber = Common.RemoveSpecialCharacterWithSpace(dr["searchheadingnumber"].toString().toLowerCase().trim());
                    indexDocument.parentheadings = [{ id: "", name: "", ordering: "" }];
                    indexDocument.url = dr["url"].toString().toLowerCase().trim();
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
                            objCourtinfo.url = Common.GetUrl(objCourtinfo.name.toLowerCase());
                            objCourtInfoes.push(objCourtinfo);
                            if (!objCourtinfo.name.trim()) {
                                objSuggest.push({
                                    Input: [objCourtinfo.name.toLowerCase().trim()],
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
                            objBenchinfo.url = Common.GetUrl(objBenchinfo.name.toLowerCase());
                            objBenchinfoes.push(objBenchinfo);
                            if (!objBenchinfo.name.trim()) {
                                objSuggest.push({
                                    Input: [objBenchinfo.name.toLowerCase().trim()],
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
                            objBenchTypeinfo.url = Common.GetUrl(objBenchTypeinfo.name.toLowerCase());
                            benchTypeInfoes.push(objBenchTypeinfo);
                            if (!objBenchTypeinfo.name.trim()) {
                                objSuggest.push({
                                    Input: [objBenchTypeinfo.name.toLowerCase().trim()],
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
                                    Input: [objInfavOf.name.toLowerCase().trim()],
                                    Weight: 1
                                });
                            }
                        }
                    }

                    let objServices: GenericInfo[] = [];
                    const serviceinfo: string[] = String(dr["ServiceInfo"]).replace("$|", " ").split('|');
                    if (serviceinfo && serviceinfo.length > 1) {
                        if (!!serviceinfo[0]) {
                            let objserviceinfo: GenericInfo = {} as GenericInfo;
                            objserviceinfo.id = String(serviceinfo[0]).trim();
                            objserviceinfo.type = "service";
                            objserviceinfo.shortName = String(serviceinfo[2]).trim();
                            objserviceinfo.name = String(serviceinfo[2]).trim();
                            objserviceinfo.ordering = objserviceinfo.name.toLowerCase();
                            objserviceinfo.orderInteger = parseInt(serviceinfo[3]);
                            objserviceinfo.url = Common.GetUrl(objserviceinfo.name.toLowerCase());
                            objServices.push(objserviceinfo);
                            //if (!objserviceinfo.name.trim()) {
                            //  objSuggest.push(objserviceinfo.name.toLowerCase().trim());
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
                                if (type !== "" && type.toLowerCase() === "account standard") {
                                    if (!!asindasinfo[0].split('|')[0]) {
                                        let objasinfo: GenericInfo = {} as GenericInfo;
                                        objasinfo.id = asindasinfo[0].split('|')[0].trim();
                                        objasinfo.type = "accountingstandard";
                                        objasinfo.name = asindasinfo[1].split('#')[0].trim();
                                        objasinfo.shortName = objasinfo.name.split(':')[0].trim();
                                        objasinfo.ordering = objasinfo.shortName.toLowerCase();
                                        objasinfo.orderInteger = parseInt(asindasinfo[1].split('#')[1].split('~')[0].trim(), 10);
                                        objasinfo.year = asindasinfo[1].split('#')[1].split('~')[1].trim();
                                        objasinfo.url = Common.GetUrl(objasinfo.shortName.toLowerCase());
                                        objasinfoes.push(objasinfo);
                                        //if (!objasinfo.name.trim()) {
                                        //  objSuggest.push(objasinfo.name.trim());
                                        //}
                                    }
                                } else if (type !== "" && type.toLowerCase() === "ind as") {
                                    if (!!asindasinfo[0].split('|')[0]) {
                                        let objindasinfo: GenericInfo = {} as GenericInfo;
                                        objindasinfo.id = asindasinfo[0].split('|')[0].trim();
                                        objindasinfo.type = "indas";
                                        objindasinfo.name = asindasinfo[1].split('#')[0].trim();
                                        objindasinfo.shortName = objindasinfo.name.split(':')[0].trim();
                                        objindasinfo.ordering = objindasinfo.shortName.toLowerCase();
                                        objindasinfo.orderInteger = parseInt(asindasinfo[1].split('#')[1].split('~')[0].trim(), 10);
                                        objindasinfo.year = asindasinfo[1].split('#')[1].split('~')[1].trim();
                                        objindasinfo.url = Common.GetUrl(objindasinfo.shortName.toLowerCase());
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

                    const citationString: string = dr["citation"].toString();
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
                                    objJournal.ordering = idName[1].toLowerCase();
                                    objJournal.type = "journal";
                                    objJournal.url = Common.GetUrl(objJournal.name);
                                }

                                if (yearJournalVolumePage[2]) {
                                    objVolume.id = yearJournalVolumePage[2];
                                    objVolume.name = yearJournalVolumePage[2].trim() ? parseInt(yearJournalVolumePage[2].trim(), 10).toString().padStart(4, '0') : Common.getRepeat("?", 4);
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
                                objJournal.ordering = idName[1].toLowerCase();
                                objJournal.type = "journal";
                                objJournal.url = Common.GetUrl(objJournal.name);
                            }

                            if (yearJournalVolumePage[2]) {
                                objVolume.id = yearJournalVolumePage[2];
                                objVolume.name = yearJournalVolumePage[2].trim() ? parseInt(yearJournalVolumePage[2].trim(), 10).toString().padStart(4, '0') : Common.getRepeat("?", 4);
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
                        if (!!item) indexDocument.sortheadingnumber = item.toString();
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

                    if (!!dr["fullcitation"].toString()) {
                        let fullcitation: string = dr["fullcitation"].toString().trimEnd('|').replace('|', '/');
                        const objFullCitation: otherinfo = {} as otherinfo;
                        objFullCitation.id = "";
                        objFullCitation.name = fullcitation + " [" + dr["documentdate"].toString().split('^')[1] + "]";
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

                    if (dr["iltassociation"].toString().indexOf('$') != -1) {
                        let citationInfoes: string[] | null = dr["iltassociation"] ? dr["iltassociation"].toString().split('$') : null;
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
                                        countries.push(objCountry1.name.toLowerCase().trim());
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
                                        countries.push(objCountry2.name.toLowerCase().trim());
                                }
                                if (cnty1cnty2artsub && cnty1cnty2artsub[2]) {
                                    if (cnty1cnty2artsub[2].length > 5) {
                                        objArticle.id = cnty1cnty2artsub[2].split('^')[0];
                                        objArticle.name = cnty1cnty2artsub[2].indexOf("#") != -1 ? cnty1cnty2artsub[2].split('^')[1].split('#')[0] : cnty1cnty2artsub[2].split('^')[1];
                                        objArticle.pid = objCountry1.id + objCountry2.id;
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
                                        articles.push(objArticle.name.toLowerCase().trim());
                                }
                                if (cnty1cnty2artsub && cnty1cnty2artsub[3]) {
                                    if (cnty1cnty2artsub[3].length > 5) {
                                        objSubject.id = cnty1cnty2artsub[3].split('^')[0].indexOf('-') != -1 ? cnty1cnty2artsub[3].split('^')[0].split('-')[0] : cnty1cnty2artsub[3].split('^')[0];
                                        objSubject.pid = objCountry1.id + objCountry2.id;
                                        objSubject.pSubId = cnty1cnty2artsub[3].split('^')[0].indexOf('-') != -1 ? cnty1cnty2artsub[3].split('^')[0].split('-')[1] : "";
                                        objSubject.name = cnty1cnty2artsub[3].split('^')[1];
                                        objSubject.shortName = "";
                                        objSubject.ordering = cnty1cnty2artsub[3].split('^')[1].toLowerCase();
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
                                        subjectArray.push(objSubject.name.toLowerCase().trim());
                                }
                                if (cnty1cnty2artsub && cnty1cnty2artsub[4]) {
                                    if (cnty1cnty2artsub[4].length > 5) {
                                        objSubSubject.id = cnty1cnty2artsub[4].split('^')[0];
                                        objSubSubject.pid = objSubject.id;
                                        objSubSubject.name = cnty1cnty2artsub[4].split('^')[1];
                                        objSubSubject.shortName = "";
                                        objSubSubject.ordering = cnty1cnty2artsub[4].split('^')[1].toLowerCase();
                                        objSubSubject.type = "subsubject";
                                        objSubSubject.url = Common.GetUrl(objSubSubject.name);
                                    }
                                    if (objSubSubject.name.trim() !== "")
                                        subjectArray.push(objSubSubject.name.toLowerCase().trim());
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
                        let objFormattedCitation: FormattedCitation = { name: "" };
                        let objCountry1: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                        let objCountry2: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                        let objArticle: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                        let objSubject: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                        let objSubSubject: iltinfo = { id: "", pid: "", pSubId: "", type: "", name: "", shortName: "", ordering: "", url: "" };
                        let cnty1cnty2artsub: string[] | null = dr["iltassociation"] ? dr["iltassociation"].toString().split('|') : null;

                        if (cnty1cnty2artsub && cnty1cnty2artsub[0]) {
                            objCountry1.id = cnty1cnty2artsub[0].split('^')[0];
                            objCountry1.name = cnty1cnty2artsub[0].split('^')[1].indexOf("#") != -1 ? cnty1cnty2artsub[0].split('^')[1].split('#')[0] : cnty1cnty2artsub[0].split('^')[1];
                            objCountry1.shortName = "";
                            objCountry1.ordering = cnty1cnty2artsub[0].split('^')[1].indexOf("#") != -1 ? cnty1cnty2artsub[0].split('^')[1].split('#')[1] : cnty1cnty2artsub[0].split('^')[1];
                            objCountry1.orderInteger = cnty1cnty2artsub[0].split('^')[1].indexOf("#") != -1 ? Number(cnty1cnty2artsub[0].split('^')[1].split('#')[1]) : 0;
                            objCountry1.type = "country1";
                            objCountry1.url = Common.GetUrl(objCountry1.name);
                            if (objCountry1.name.trim() !== "")
                                countries.push(objCountry1.name.toLowerCase().trim());
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
                                countries.push(objCountry2.name.toLowerCase().trim());
                        }
                        if (cnty1cnty2artsub && cnty1cnty2artsub[2]) {
                            if (cnty1cnty2artsub[2].length > 5) {
                                objArticle.id = cnty1cnty2artsub[2].split('^')[0];
                                objArticle.name = cnty1cnty2artsub[2].indexOf("#") != -1 ? cnty1cnty2artsub[2].split('^')[1].split('#')[0] : cnty1cnty2artsub[2].split('^')[1];
                                objArticle.pid = objCountry1.id + objCountry2.id;
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
                                articles.push(objArticle.name.toLowerCase().trim());
                        }
                        if (cnty1cnty2artsub && cnty1cnty2artsub[3]) {
                            if (cnty1cnty2artsub[3].length > 5) {
                                objSubject.id = cnty1cnty2artsub[3].split('^')[0].indexOf('-') != -1 ? cnty1cnty2artsub[3].split('^')[0].split('-')[0] : cnty1cnty2artsub[3].split('^')[0];
                                objSubject.name = cnty1cnty2artsub[3].split('^')[1];
                                objSubject.pSubId = cnty1cnty2artsub[3].split('^')[0].indexOf('-') != -1 ? cnty1cnty2artsub[3].split('^')[0].split('-')[1] : "";
                                objSubject.shortName = "";
                                objSubject.ordering = cnty1cnty2artsub[3].split('^')[1].toLowerCase();
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
                                subjectArray.push(objSubject.name.toLowerCase().trim());
                        }
                        if (cnty1cnty2artsub && cnty1cnty2artsub[4]) {
                            if (cnty1cnty2artsub[4].length > 5) {
                                objSubSubject.id = cnty1cnty2artsub[4].split('^')[0];
                                objSubSubject.pid = objSubject.id;
                                objSubSubject.name = cnty1cnty2artsub[4].split('^')[1];
                                objSubSubject.shortName = "";
                                objSubSubject.ordering = cnty1cnty2artsub[4].split('^')[1].toLowerCase();
                                objSubSubject.type = "subsubject";
                                objSubSubject.url = Common.GetUrl(objSubSubject.name);
                            }
                            if (objSubSubject.name.trim() !== "")
                                subjectArray.push(objSubSubject.name.toLowerCase().trim());
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
                                const marking1 = markings[1].replace("&#39;", "'");
                                const markingInfo: Markinginfo = {
                                    number: num,
                                    text: markings[0],
                                    image: marking1.split('^')[0],
                                };

                                if (num === 1) {
                                    topStoryHeading = marking1.split('^')[1].split(new RegExp("##", "g"))[0];
                                    topStoryDesc = marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[0];
                                }

                                const pmark = marking1.indexOf("@@e") !== -1 ? marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[1].split('~')[1].split('\\')[1].replace('_', ' ').trim().split(new RegExp("@@e", "g"))[1] : "";
                                const parentmark = marking1.indexOf("@@t") !== -1 ? pmark.split(new RegExp("@@t", "g")) : null;

                                markingInfo.entrydate = marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[1].split('~')[1].split('\\')[0];
                                markingInfo.updateddate = marking1.split('^')[1].split(new RegExp("##", "g"))[1].split(new RegExp("@@i", "g"))[1].split('~')[1].split('\\')[1].replace('_', ' ').trim().split(new RegExp("@@e", "g"))[0];

                                if (parentmark !== null) {
                                    markingInfo.parentmarking = (parentmark[0] + ", " + parentmark[1]).trim().replace(/^,/, '').toLowerCase();
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

                    if (!!dr["hn1"].toString()) {
                        lstHeadNotes.push({ number: 1, text: dr["hn1"].toString() });
                        headnotesttext += dr["hn1"].toString() + "~~";
                    }
                    if (!!dr["hn2"].toString()) {
                        lstHeadNotes.push({ number: 2, text: dr["hn2"].toString() });
                        headnotesttext += dr["hn2"].toString() + "~~";
                    }
                    if (!!dr["hn3"].toString()) {
                        lstHeadNotes.push({ number: 3, text: dr["hn3"].toString() });
                        headnotesttext += dr["hn3"].toString() + "~~";
                    }
                    if (!!dr["hn4"].toString()) {
                        lstHeadNotes.push({ number: 4, text: dr["hn4"].toString() });
                        headnotesttext += dr["hn4"].toString() + "~~";
                    }
                    if (!!dr["hn5"].toString()) {
                        lstHeadNotes.push({ number: 5, text: dr["hn5"].toString() });
                        headnotesttext += dr["hn5"].toString() + "~~";
                    }
                    if (!!dr["hn6"].toString()) {
                        lstHeadNotes.push({ number: 6, text: dr["hn6"].toString() });
                        headnotesttext += dr["hn6"].toString() + "~~";
                    }
                    if (!!dr["hn7"].toString()) {
                        lstHeadNotes.push({ number: 7, text: dr["hn7"].toString() });
                        headnotesttext += dr["hn7"].toString() + "~~";
                    }
                    if (!!dr["hn8"].toString()) {
                        lstHeadNotes.push({ number: 8, text: dr["hn8"].toString() });
                        headnotesttext += dr["hn8"].toString() + "~~";
                    }
                    if (!!dr["hn9"].toString()) {
                        lstHeadNotes.push({ number: 9, text: dr["hn9"].toString() });
                        headnotesttext += dr["hn9"].toString() + "~~";
                    }
                    if (!!dr["hn10"].toString()) {
                        lstHeadNotes.push({ number: 10, text: dr["hn10"].toString() });
                        headnotesttext += dr["hn10"].toString() + " ";
                    }

                    indexDocument.headnotes = lstHeadNotes;

                    //#endregion


                    if (dr["court"].toString().indexOf("111270000000000009") !== -1) // 111270000000000009^Supreme Court of India^SC
                        indexDocument.documenttypeboost = 5000;
                    else if (dr["court"].toString().indexOf("111270000000000044") !== -1) // 111270000000000044^High Court^HC
                        indexDocument.documenttypeboost = 4500;
                    else if (dr["court"].toString().indexOf("111270000000000002") !== -1) // 111270000000000002^Authority for Advance Ruling^AAR
                        indexDocument.documenttypeboost = 4000;
                    else if (dr["court"].toString().indexOf("111270000000000007") !== -1) // 111270000000000007^Income Tax Appellate Tribunal^ITAT
                        indexDocument.documenttypeboost = 3500;
                    else
                        indexDocument.documenttypeboost = 3200;

                    const headings: string[] = [];
                    if (!!dr["HeadingSubheading"].toString()) {
                        const headingSubheadings = dr["HeadingSubheading"].toString().split('$');
                        for (const headsubhead of headingSubheadings) {
                            if (headsubhead.indexOf('|') !== -1) {
                                if (headsubhead.split('|')[0] !== "")
                                    headings.push(headsubhead.split('|')[0].toLowerCase().trim());
                                if (headsubhead.split('|')[1] !== "")
                                    headings.push(headsubhead.split('|')[1].toLowerCase().trim());
                            }
                        }
                    }

                    if (headings.length > 0) {
                        objSuggest.push({
                            Input: headings,
                            Weight: 16
                        });
                    }

                    indexDocument.searchboosttext = Common.RemoveSpecialCharacterWithSpace(
                        dr["categoriescentax"].toString().toLowerCase() + " " +
                        dr["groups"].toString().toLowerCase() + " " +
                        dr["fullcitation"].toString().toLowerCase() + " " +
                        dr["partyname1"].toString().toLowerCase() + " " +
                        dr["partyname2"].toString().toLowerCase() + " appeal no " +
                        dr["appealno"].toString().toLowerCase() + " " +
                        Common.StringOnly(dr["counselnameappellant"].toString()).toLowerCase() + " " +
                        Common.StringOnly(dr["counselnamerespondent"].toString()).toLowerCase() + " " +
                        Common.StringOnly(dr["judgename"].toString()).toLowerCase() + " " +
                        dr["documentdate"].toString().toLowerCase() + " " +
                        Common.StringOnly(dr["court"].toString()).toLowerCase() + " " +
                        Common.StringOnly(dr["bench"].toString()).toLowerCase() + " " +
                        Common.StringOnly(dr["benchtype"].toString()).toLowerCase() + " " +
                        Common.StringOnly(dr["InfavourofText"].toString()).toLowerCase() + " " +
                        Common.StringOnly(dr["actassociations"].toString()).toLowerCase() + " " +
                        dr["Heading"].toString().trim() + " " +
                        dr["subheading"].toString().trim()
                    );
                    indexDocument.headnotestext = headnotesttext + " " + indexDocument.searchboosttext;
                    indexDocument.shortcontent = dr["shortcontent"].toString().trim();

                    //#region footnote region
                    let fullContent: string = "";
                    const footnotecontent: string[] = [];

                    const doc = new DOMParser().parseFromString(String(dr["fullcontent"]), "text/html");

                    const isHtmlFootnote: boolean = !!doc.querySelector("div.footprint");

                    if (isHtmlFootnote && indexDocument.documentformat === ".htm") {
                        const footprints = doc.querySelectorAll("div.footprint");
                        footprints.forEach((item) => {
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

                        fullContent = String(dr["fullcontent"]).replace(regexfootnote, "");
                    } else {
                        fullContent = String(dr["fullcontent"]);
                    }

                    indexDocument.footnotecontent = footnotecontent.join("");

                    //#endregion

                } catch (ex) {
                    // Handle the exception
                    console.error(ex.message);
                }
            }

            // The rest of your code for processing dataRows and adding to indexDocumentList will go here
        }
    }

    // Return the final result (you can adjust the return value based on the actual requirements)
    return reccount;
}
