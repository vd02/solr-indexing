import * as fs from "fs";
import * as path from "path";
export class Common {
    public static GetUrl(title: any): string {
        let strUrl: string = title.toString();
        strUrl = strUrl.trim();
        strUrl = strUrl.replace('-', '').toLowerCase();

        const chars: string[] = ['$', '%', '#', '@', '!', '*', '?', ';', ':', '~', '`', '+=()[]{}|\\\'<>,/^&".'];

        for (let i = 0; i < chars.length; i++) {
            const strChar: string = chars[i];
            if (strUrl.includes(strChar)) {
                strUrl = strUrl.replace(new RegExp(escapeRegExp(strChar), 'g'), '');
            }
        }

        strUrl = strUrl.replace(/ /g, '-');
        strUrl = strUrl.replace(/--+/g, '-');
        strUrl = strUrl.trim();
        strUrl = strUrl.replace(/^-+|-+$/g, '');

        return strUrl;
    }

    public static CasePopularActsfinal(): Record<string, string[]> {
        const acts: Record<string, string[]> = {
            "102010000000000005": ["Administrative Tribunals Act, 1985", "centax-customs,centax-excise-service-tax"],
            "102010000000000101": ["Code Of Criminal Procedure, 1973", "centax-customs,centax-excise-service-tax"],
            "102010000000000130": ["Conservation Of Foreign Exchange And Prevention Of Smuggling Activities Act, 1974", "centax-customs"],
            "102010000000000131": ["Constitution of India", "centax-customs,centax-excise-service-tax"],
            "102010000000000152": ["Customs Act, 1962", "centax-customs,centax-excise-service-tax"],
            "102010000000000195": ["Evidence Act, 1872", "centax-customs"],
            "102010000000000284": ["Foreign Exchange Management Act, 1999", "centax-customs"],
            "102010000000000285": ["Foreign Exchange Regulation Act, 1947", "centax-customs"],
            "102010000000000286": ["Foreign Exchange Regulation Act, 1973", "centax-customs"],
            "102010000000000288": ["Foreign Trade (Development And Regulation) Act, 1992", "centax-customs"],
            "102010000000000290": ["Foreign Trade (Regulation) Rules, 1993", "centax-customs"],
            "102010000000000293": ["General Clauses Act, 1897", "centax-customs,centax-excise-service-tax"],
            "102010000000000302": ["Gold Control Act, 1968", "centax-customs"],
            "102010000000000345": ["Indian Contract Act, 1872", "centax-customs"],
            "102010000000000349": ["Indian Evidence Act, 1872", "centax-customs,centax-excise-service-tax"],
            "102010000000000422": ["Limitation Act, 1963", "centax-customs,centax-excise-service-tax"],
            "102010000000000446": ["Major Port Trusts Act, 1963", "centax-customs"],
            "102010000000000498": ["Prevention Of Corruption Act, 1988", "centax-customs,centax-excise-service-tax"],
            "102010000000000499": ["Prevention Of Money Laundering Act, 2002", "centax-customs"],
            "102010000000000532": ["Right To Information Act, 2005", "centax-customs,centax-excise-service-tax"],
            "102010000000000535": ["Sale Of Goods Act, 1930", "centax-customs,centax-excise-service-tax"],
            "102010000000000589": ["Smugglers And Foreign Exchange Manipulators (Forfeiture Of Property) Act, 1976", "centax-customs"],
            "102010000000000595": ["Special Economic Zone Act, 2005", "centax-customs"],
            "102010000000000632": ["Transfer Of Property Act, 1882", "centax-customs,centax-excise-service-tax"],
            "102010000000001020": ["Customs Tariff Act, 1975", "centax-customs"],
            "102010000000001035": ["Customs Valuation (DPIG) Rules, 1988", "centax-customs"],
            "102010000000001051": ["Customs House Agents Licensing Regulations, 2004", "centax-customs"],
            "102010000000001869": ["Special Economic Zones Rules, 2006", "centax-customs"],
            "102010000000001932": ["Import and Export (Control) Act, 1947", "centax-customs"],
            "102010000000001933": ["Provisional Collection of Taxes Act, 1931", "centax-customs,centax-excise-service-tax"],
            "102010000000001936": ["Gold Control (Licencing of Dealers) Rules, 1969", "centax-customs"],
            "102010000000001950": ["Customs, Excise And Service Tax Appellate Tribunal Members (Recruitment and Conditions of Service) Rules, 1987", "centax-customs,centax-excise-service-tax"],
            "102010000000001964": ["CEGAT (Procedure) Rules, 1982", "centax-customs,centax-excise-service-tax"],
            "102010000000002284": ["Narcotic Drugs and Psychotropic Substances Act, 1985", "centax-customs,centax-excise-service-tax"],
            "102010000000002501": ["Sea Customs Act, 1878", "centax-customs"],
            "102010000000002502": ["Sea Customs Act, 1898", "centax-customs"],
            "102010000000005182": ["Central Excises and Customs Laws (Amendment) Act, 1991", "centax-customs,centax-excise-service-tax"],
            "102010000000005405": ["Merchant Shipping Act, 1958", "centax-customs"],
            "102010000000000018": ["Andhra Pradesh General Sales Tax Act, 1957", "centax-excise-service-tax"],
            "102010000000000063": ["Bombay Sales Tax Act, 1959", "centax-excise-service-tax"],
            "102010000000000074": ["Central Excise Act, 1944", "centax-excise-service-tax"],
            "102010000000000076": ["Central Excise Rules, 1944", "centax-excise-service-tax"],
            "102010000000000082": ["Central Sales Tax Act, 1956", "centax-excise-service-tax"],
            "102010000000000086": ["Cenvat Credit Rules, 2004", "centax-excise-service-tax"],
            "102010000000000160": ["Delhi Sales Tax Act, 1975", "centax-excise-service-tax"],
            "102010000000000162": ["Delhi Value Added Tax Act, 2004", "centax-excise-service-tax"],
            "102010000000000191": ["Essential Commodities Act, 1955", "centax-excise-service-tax"],
            "102010000000000201": ["Export Of Services Rules, 2005", "centax-excise-service-tax"],
            "102010000000000203": ["Factories Act, 1948", "centax-excise-service-tax"],
            "102010000000000271": ["Finance Act, 1994", "centax-excise-service-tax"],
            "102010000000000377": ["Insecticides Act, 1968", "centax-excise-service-tax"],
            "102010000000000397": ["Karnataka Sales Tax Act, 1957", "centax-excise-service-tax"],
            "102010000000000401": ["Karnataka Value Added Tax Act, 2003", "centax-excise-service-tax"],
            "102010000000000408": ["Kerala General Sales Tax Act, 1963", "centax-excise-service-tax"],
            "102010000000000413": ["Kerala Value Added Tax Act, 2003", "centax-excise-service-tax"],
            "102010000000000445": ["Maharashtra Value Added Tax Act, 2002", "centax-excise-service-tax"],
            "102010000000000493": ["Place Of Provision Of Services Rules, 2012", "centax-excise-service-tax"],
            "102010000000000511": ["Punjab Value Added Tax Act, 2005", "centax-excise-service-tax"],
            "102010000000000515": ["Rajasthan Sales-Tax Act, 1994", "centax-excise-service-tax"],
            "102010000000000580": ["Service Tax Credit Rules, 2002", "centax-excise-service-tax"],
            "102010000000000581": ["Service Tax Rules, 1994", "centax-excise-service-tax"],
            "102010000000000599": ["Standards of Weights And Measures Act, 1976", "centax-excise-service-tax"],
            "102010000000000612": ["Tamil Nadu General Sales Tax Act, 1959", "centax-excise-service-tax"],
            "102010000000000624": ["Taxation Of Services (Provided From Outside India And Received In India) Rules, 2006", "centax-excise-service-tax"],
            "102010000000000626": ["Textiles Committee Act, 1963", "centax-excise-service-tax"],
            "102010000000000628": ["Trade And Merchandise Marks Act, 1958", "centax-excise-service-tax"],
            "102010000000000656": ["U.P. Trade Tax Act, 1948", "centax-excise-service-tax"],
            "102010000000000679": ["Works Contract (Composition Scheme For Payment Of Service Tax) Rules, 2007", "centax-excise-service-tax"],
            "102010000000000755": ["Prevention of Food Adulteration Act, 1954", "centax-excise-service-tax"],
            "102010000000000764": ["Service Tax (Determination of Value) Rules, 2006", "centax-excise-service-tax"],
            "102010000000000860": ["Central Excises and Salt Act, 1944", "centax-excise-service-tax"],
            "102010000000001015": ["Central Excise Tariff Act, 1985", "centax-excise-service-tax"],
            "102010000000001022": ["Gujarat Value Added Tax Act, 2003", "centax-excise-service-tax"],
            "102010000000001027": ["Central Excise Valuation (Determination of Price of excisable goods) Rules, 2000", "centax-excise-service-tax"],
            "102010000000001032": ["Rajasthan Value Added Tax Act, 2003", "centax-excise-service-tax"],
            "102010000000001034": ["Additional Duty of Excise (T&TA) Act, 1978", "centax-excise-service-tax"],
            "102010000000001036": ["Standards of Weights and Measures (Packaged Commodity) Rules, 1977", "centax-excise-service-tax"],
            "102010000000001049": ["Tamil Nadu Value Added Tax Act, 2006", "centax-excise-service-tax"],
            "102010000000001052": ["Pan Masala Packing Machines (Capacity Determination and Collection of Duty) Rules, 2008", "centax-excise-service-tax"],
            "102010000000001073": ["Uttar Pradesh Value Added Tax Act, 2008", "centax-excise-service-tax"],
            "102010000000001083": ["Uttar Pradesh Trade Tax Act, 1948", "centax-excise-service-tax"],
            "102010000000001100": ["Additional Duties of Excise (Goods of Special Importance) Act, 1957", "centax-excise-service-tax"],
            "102010000000001101": ["Rubber Act, 1947", "centax-excise-service-tax"],
            "102010000000001106": ["Drugs and Cosmetics Act, 1940", "centax-excise-service-tax"],
            "102010000000001110": ["U.P. Value Added Tax Act, 2008", "centax-excise-service-tax"],
            "102010000000001271": ["Induction Furnace Annual Capacity Determination Rules, 1997", "centax-excise-service-tax"],
            "102010000000001891": ["Agricultural Produce Cess Act, 1940", "centax-excise-service-tax"],
            "102010000000001897": ["Central Excise Act, 1994", "centax-excise-service-tax"],
            "102010000000001917": ["U.P. Sales Tax Act, 1948", "centax-excise-service-tax"],
            "102010000000001919": ["Central Excise (No. 2) Rules, 2001", "centax-excise-service-tax"],
            "102010000000001923": ["Vegetable Oils Cess Act, 1983", "centax-excise-service-tax"],
            "102010000000001947": ["Central Excise Valuation Rules, 1975", "centax-excise-service-tax"],
            "102010000000001973": ["Tamil Nadu Value Added Tax Rules, 2007", "centax-excise-service-tax"],
            "102010000000002138": ["Drugs and Cosmetics Rules, 1945", "centax-excise-service-tax"],
            "102010000000002227": ["Legal Metrology (Packaged Commodities) Rules, 2011", "centax-excise-service-tax"],
            "102010000000002267": ["Indian Tariff Act, 1934", "centax-excise-service-tax"],
            "102010000000002452": ["Central Sales Tax Amendment Act, 1969", "centax-excise-service-tax"],
            "102010000000002530": ["Central Duties of Excise (Retrospective Exemption) Act, 1986", "centax-excise-service-tax"],
            "102010000000005151": ["Indian Telegraph Act, 1885", "centax-excise-service-tax"],
            "102010000000005438": ["Food Safety And Standards Act, 2006", "centax-excise-service-tax"],
            "102010000000005574": ["Central Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005575": ["Goods And Services Tax (Compensation To States) Act, 2017", "centax-gst"],
            "102010000000005576": ["Integrated Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005577": ["Union Territory Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005615": ["Rajasthan Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005632": ["Bihar Goods & Services Tax Act, 2017", "centax-gst"],
            "102010000000005633": ["Telangana Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005634": ["Himachal Pradesh Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005635": ["Puducherry Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005636": ["Maharashtra Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005637": ["Goa Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005638": ["Uttar Pradesh Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005639": ["Haryana Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005640": ["Assam Goods and Services Tax Act, 2017", "centax-gst"],
            "102010000000005641": ["Delhi Goods and Services Tax Act, 2017", "centax-gst"],
            "102010000000005643": ["Nagaland Goods and Services Tax Act, 2017", "centax-gst"],
            "102010000000005644": ["Odisha Goods and Services Tax Act, 2017", "centax-gst"],
            "102010000000005647": ["West Bengal Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005648": ["Tripura State Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005649": ["Jharkhand Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005650": ["Madhya Pradesh Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005651": ["Chhattisgarh Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005652": ["Andhra Pradesh Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005653": ["Mizoram Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005654": ["Tamil Nadu Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005655": ["Punjab Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005656": ["Kerala State Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005657": ["Karnataka Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005658": ["Meghalaya Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005659": ["Gujarat Goods And Services Tax Act 2017", "centax-gst"],
            "102010000000005660": ["Jammu And Kashmir Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005661": ["Uttarakhand Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005662": ["Manipur Goods And Services Tax Act, 2017", "centax-gst"],
            "102010000000005678": ["Integrated Goods And Services Tax (Extension To Jammu And Kashmir) Act, 2017", "centax-gst"],
            "102010000000005679": ["Central Goods And Services Tax (Extension To Jammu And Kashmir) Act, 2017", "centax-gst"],
            "102010000000005682": ["Sikkim Goods and Services Tax Act, 2017", "centax-gst"],
            "102010000000005702": ["Arunachal Pradesh Goods and Services Tax Act, 2017", "centax-gst"],
            "102010000000005769": ["Maharashtra Settlement Of Arrears Of Tax, Interest, Penalty Or Late Fee Ordinance, 2019", "centax-gst"]
        };
        return acts;
    }

    public static CasePopularActs(): Record<string, string[]> {
        const acts: Record<string, string[]> = {
            "102010000000000337": ["Income-tax Act, 1961", "direct-tax-laws,international-tax,transfer-pricing"],
            "102010000000000045": ["Prohibition of Benami Property Transactions Act, 1988", "direct-tax-laws"],
            "102010000000000793": ["Companies Act, 2013", "company-and-sebi,ibc"],
            "102010000000000112": ["Companies Act, 1956", "company-and-sebi,ibc"],
            "102010000000000569": ["SEBI Act, 1992", "company-and-sebi"],
            "102010000000000560": ["Sebi (Prohibition of Fraudulent And Unfair Trade Practice Relating to Securities Market) Regulation, 2003", "company-and-sebi"],
            "102010000000000563": ["SEBI (Stock Brokers And Sub-Brokers) Regulations, 1992", "company-and-sebi"],
            "102010000000000564": ["SEBI (Substantial Acquisition of Shares And Takeovers) Regulations, 1994/1997", "company-and-sebi"],
            "102010000000000284": ["Foreign Exchange Management Act, 1999", "fema-banking-insurance"],
            "102010000000000473": ["Negotiable Instruments Act, 1881", "fema-banking-insurance"],
            "102010000000000499": ["Prevention of Money Laundering Act, 2002", "fema-banking-insurance"],
            "102010000000000516": ["Recovery of Debts and Bankruptcy Act, 1993", "fema-banking-insurance"],
            "102010000000000576": ["Securitisation And Reconstruction of Financial Assets And Enforcement of Security Interest Act, 2002", "fema-banking-insurance"],
            "102010000000000379": ["Insurance Act, 1938", "fema-banking-insurance"],
            "102010000000000124": ["Competition Act, 2002", "competition-law"],
            "102010000000005389": ["Insolvency and Bankruptcy Code, 2016", "ibc"],
            "102010000000005574": ["Central GST Act, 2017", "gst-new"],
            "102010000000005576": ["Integrated GST Act, 2017", "gst-new"],
            "102010000000005652": ["Andhra Pradesh GST Act, 2017", "gst-new"],
            "102010000000005640": ["Assam GST Act, 2017", "gst-new"],
            "102010000000005632": ["Bihar Goods & Services Tax Act, 2017", "gst-new"],
            "102010000000005651": ["Chhattisgarh GST, 2017", "gst-new"],
            "102010000000005641": ["Delhi GST Act, 2017", "gst-new"],
            "102010000000005637": ["Goa GST Act, 2017", "gst-new"],
            "102010000000005575": ["GST(Compensation to States) Act, 2017", "gst-new"],
            "102010000000005659": ["Gujarat GST Act 2017", "gst-new"],
            "102010000000005639": ["Haryana GST Act, 2017", "gst-new"],
            "102010000000005634": ["Himachal Pradesh GST Act, 2017", "gst-new"],
            "102010000000005649": ["Jharkhand GST Act, 2017", "gst-new"],
            "102010000000005657": ["Karnataka GST Act, 2017", "gst-new"],
            "102010000000005656": ["Kerala GST Act, 2017", "gst-new"],
            "102010000000005650": ["Madhya Pradesh GST Act, 2017", "gst-new"],
            "102010000000005636": ["Maharashtra GST Act, 2017", "gst-new"],
            "102010000000005644": ["Odisha GST Act, 2017", "gst-new"],
            "102010000000005655": ["Punjab GST Act, 2017", "gst-new"],
            "102010000000005615": ["Rajasthan GST Act, 2017", "gst-new"],
            "102010000000005654": ["Tamil Nadu GST Act, 2017", "gst-new"],
            "102010000000005633": ["Telangana GST Act, 2017", "gst-new"],
            "102010000000005577": ["Union Territory GST Act, 2017", "gst-new"],
            "102010000000005638": ["Uttar Pradesh GST Act, 2017", "gst-new"],
            "102010000000005661": ["Uttarakhand GST Act, 2017", "gst-new"],
            "102010000000005647": ["West Bengal GST Act, 2017", "gst-new"],
            "102010000000000271": ["Finance Act, 1994", "goods-services-tax"],
            "102010000000000074": ["Central Excise Act, 1944", "goods-services-tax"],
            "102010000000000086": ["Cenvat Credit Rules, 2004", "goods-services-tax"],
            "102010000000000152": ["Customs Act, 1962", "goods-services-tax"],
            "102010000000000581": ["Service Tax Rules, 1994", "goods-services-tax"],
            "102010000000000201": ["Export of Services Rules,2005", "goods-services-tax"],
            "102010000000001015": ["Central Excise Tariff Act, 1985", "goods-services-tax"],
            "102010000000000076": ["Central Excise Rules, 1944", "goods-services-tax"],
            "102010000000001947": ["Central Excise Valuation Rules, 1975", "goods-services-tax"],
            "102010000000001027": ["Central Excise Valuation (Determination of Price of excisable goods) Rules, 2000", "goods-services-tax"],
            "102010000000000085": ["Cenvat Credit Rules, 2002", "goods-services-tax"],
            "102010000000001020": ["Customs Tariff Act, 1975", "goods-services-tax"],
            "102010000000001035": ["Customs Valuation (DPIG) Rules, 1988", "goods-services-tax"],
            "102010000000000082": ["Central Sales Tax Act, 1956", "goods-services-tax"],
            "102010000000000018": ["Andhra Pradesh General Sales Tax Act, 1957", "goods-services-tax"],
            "102010000000001955": ["Constitution of India, 1950", "goods-services-tax"],
            "102010000000000162": ["Delhi Value Added Tax Act, 2004", "goods-services-tax"],
            "102010000000001062": ["Haryana Value Added Tax Act, 2003", "goods-services-tax"],
            "102010000000001065": ["Jharkhand Value Added Tax Act, 2005", "goods-services-tax"],
            "102010000000000397": ["Karnataka Sales Tax Act, 1957", "goods-services-tax"],
            "102010000000000401": ["Karnataka Value Added Tax Act, 2003", "goods-services-tax"],
            "102010000000001114": ["Karnataka Value Added Tax Rules, 2005", "goods-services-tax"],
            "102010000000000408": ["Kerala General Sales Tax Act, 1963", "goods-services-tax"],
            "102010000000000413": ["Kerala Value Added Tax Act, 2003", "goods-services-tax"],
            "102010000000000445": ["Maharashtra Value Added Tax Act, 2002", "goods-services-tax"],
            "102010000000001075": ["Odisha Value Added Tax Act, 2004", "goods-services-tax"],
            "102010000000001119": ["Orissa Value Added Tax Act, 2004", "goods-services-tax"],
            "102010000000000511": ["Punjab Value Added Tax Act, 2005", "goods-services-tax"],
            "102010000000001032": ["Rajasthan Value Added Tax Act, 2003", "goods-services-tax"],
            "102010000000000612": ["Tamil Nadu General Sales Tax Act, 1959", "goods-services-tax"],
            "102010000000001072": ["Tripura Value Added Tax Act, 2004", "goods-services-tax"],
            "102010000000002427": ["U. P. Sugarcane (Purchase Tax) Rules, 1961", "goods-services-tax"],
            "102010000000001917": ["U.P. Sales Tax Act, 1948", "goods-services-tax"],
            "102010000000002411": ["U.P. Sugarcane Purchase Tax Act, 1961", "goods-services-tax"],
            "102010000000000656": ["U.P. Trade Tax Act, 1948", "goods-services-tax"],
            "102010000000001042": ["U.P. Trade Tax Rules, 1948", "goods-services-tax"],
            "102010000000001110": ["U.P. Value Added Tax Act, 2008", "goods-services-tax"],
            "102010000000001024": ["Uttarakhand Value Added Tax Act, 2005", "goods-services-tax"],
            "102010000000001019": ["West Bengal Value Added Tax Act, 2003", "goods-services-tax"]
        };

        return acts;
    }


    public static OtherActs(): Record<string, string[]> {
        const acts: Record<string, string[]> = {};
        acts["999999999999999999"] = ["otheract", "goods-services-tax"];
        return acts;
    }

    public static converttoyymmdd(value: string): string {
        const val: string[] = value.split('-');
        const result: string = val[2].trim() + val[1].trim() + val[0].trim();
        return result;
    }

    public static getRepeat(value: string, count: number): string {
        return value.repeat(count);
    }

    public static RemoveSpecialCharacterWithSpace(value: string): string {
        return value.replace(/[^0-9a-zA-Z]+/g, ' ');
    }

    public static StringOnly(value: string): string {
        return value.replace(/\d{18}/g, " ");
    }

    public static GetMetaTag(fullcontent: string): string {
        const regexheader = /<header>(.*?)<\/header>/gs;
        const objHeader: string[] = [];
        const matchesheader = fullcontent.match(regexheader);

        if (matchesheader !== null) {
            matchesheader.forEach((matchhead) => {
                objHeader.push(matchhead);
            });
        }

        return objHeader.join("");
    }


    public static RemovedHeaderTag(fullContent: string): string {
        const regexHeader = /<header>(.*?)<\/header>/gi;
        return fullContent.replace(regexHeader, "");
    }


    public static LogErrorId(Id: string): void {
        try {
            const spath = process.env.logPath; // Assuming you have set the logPath environment variable
            const filePath = path.join(
                spath,
                `LogErrorId${new Date().toISOString().slice(0, 10)}.txt`
            );

            if (!fs.existsSync(spath)) {
                fs.mkdirSync(spath);
            }

            const strLogText = `${Id},`;

            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, strLogText);
            } else {
                fs.appendFileSync(filePath, strLogText);
            }
        } catch (ex) {
            // Handle the error here if necessary
        }
    }

    public static LogError(ex: Error, msg: string = ""): void {
        try {
            let message = `Time: ${new Date().toLocaleString()}\n`;
            message += "-----------------------------------------------------------\n";
            message += `Message: ${ex.message}\n`;
            message += `StackTrace: ${ex.stack}\n`;
            message += `Source: ${ex.name}\n`;

            //   if (ex.innerException != null) {
            //     message += `Inner Exception: ${ex.innerException.message}\n`;
            //   }

            message += `TargetSite: ${ex.toString()}\n`;
            message += "-----------------------------------------------------------\n";

            if (msg) {
                message += msg;
                message += "-----------------------------------------------------------\n";
            }

            console.error(message); // Using console.error to differentiate from regular console.log

        } catch (error) {
            // Do nothing or handle the error in a way that suits your application
        }
    }
    public static writeLog(strLogText: string): void {
        const logPath: string = process.env.logPath || 'D:\\ResearchIndexLog'; // Or use your predefined configuration

        const currentDate = new Date();
        const filePath = path.join(
            logPath,
            `apiLog${currentDate.getFullYear()}${currentDate.getMonth() + 1}${currentDate.getDate()}.txt`
        );

        if (!fs.existsSync(logPath)) {
            fs.mkdirSync(logPath, { recursive: true });
        }

        const log = fs.createWriteStream(filePath, { flags: 'a' }); // 'a' flag for append mode
        log.write(`${currentDate}\n`);
        log.write(`${strLogText}\n\n`);
        log.end();
    }

    public static UploadPdfFilesOnAmazonS3Bucket(id: string, srcPath: string | undefined) { }
    public static UploadImageOnAmazonS3BucketCentax(id: string, srcPath: string | undefined) { }
    public static UploadLinkFilesOnS3Centax(cmsid: string | undefined, group: string | undefined, documentformat: string | undefined, filenamepath: string | undefined, webid: string) { }

    public static htmlFileManagement(MID: string, FilePath: string, Type: string): string {
        if (FilePath.toLowerCase().indexOf(".htm") !== -1) {
            MID = MID + ".htm";
            const ROOTPath: string = "<Your_ROOTPath>"; // Replace with the actual ROOTPath value
            const NEWPath: string = "<Your_NEWPath>"; // Replace with the actual NEWPath value

            if (!fs.existsSync(NEWPath)) {
                fs.mkdirSync(NEWPath, { recursive: true });
            }

            if (fs.existsSync(ROOTPath + FilePath)) {
                fs.copyFileSync(ROOTPath + FilePath, NEWPath + MID);
            }
        } else {
            MID = FilePath;
        }
        return MID;
    }

    public static pdfFileManagement(MID: string | undefined, FilePath: string, Type: string): string {
        if (FilePath.toLowerCase().indexOf(".pdf") !== -1) {
            if (!Type || Type.toLowerCase() === "instruction")
                MID = MID + "_instruction.pdf";
            else
                MID = MID + ".pdf";

            let ROOTPath = System.Configuration.ConfigurationManager.AppSettings["FilePath"];
            let NEWPath = System.Configuration.ConfigurationManager.AppSettings["PdfPath"];

            if (!fs.existsSync(NEWPath))
                fs.mkdirSync(NEWPath);

            if (fs.existsSync(ROOTPath + FilePath))
                fs.copyFileSync(ROOTPath + FilePath, NEWPath + MID);
        }
        else
            MID = FilePath;

        return MID;
    }

    public static CirnotPopularActs(): Map<string, string[]> {
        const acts: Map<string, string[]> = new Map();
        acts.set("102010000000000337", ["Income-tax Act, 1961", "direct-tax-laws,international-tax,transfer-pricing"]);
        acts.set("102010000000005215", ["Black Money (Undisclosed Foreign Income and Assets) and Imposition of Tax Act, 2015", "direct-tax-laws,international-tax,transfer-pricing"]);
        acts.set("102010000000000104", ["Commodities Transaction Tax", "direct-tax-laws,international-tax,transfer-pricing"]);
        acts.set("102010000000000045", ["Prohibition of Benami Property Transactions Act, 1988", "direct-tax-laws,international-tax,transfer-pricing"]);

        acts.set("102010000000005719", ["Fugitive Economic Offenders Act, 2018", "direct-tax-laws,international-tax,transfer-pricing"]);
        acts.set("102010000000005397", ["Income Declaration Scheme, 2016", "international-tax,transfer-pricing"]);
        acts.set("102010000000000574", ["Securities Transaction Tax", "international-tax,transfer-pricing"]);

        acts.set("102010000000000793", ["Companies Act, 2013", "company-and-sebi"]);
        acts.set("102010000000000112", ["Companies Act, 1956", "company-and-sebi"]);
        acts.set("102010000000000569", ["SEBI Act, 1992", "company-and-sebi"]);
        acts.set("102010000000000571", ["Securities Contracts (Regulation) Act, 1956", "company-and-sebi"]);

        acts.set("102010000000000039", ["Banking Regulation Act, 1949", "fema-banking-insurance"]);
        acts.set("102010000000000526", ["Reserve Bank Of India Act, 1934", "fema-banking-insurance"]);
        acts.set("102010000000000279", ["Foreign Contribution (Regulation) Act", "fema-banking-insurance"]);
        acts.set("102010000000000280", ["FDI", "fema-banking-insurance"]);
        acts.set("102010000000000284", ["FEMA", "fema-banking-insurance"]);
        acts.set("102010000000000287", ["Foreign Trade (Development And Regulation) Act", "fema-banking-insurance"]);
        acts.set("102010000000000381", ["IRDA", "fema-banking-insurance"]);
        acts.set("102010000000005536", ["NBFCs", "fema-banking-insurance"]);
        acts.set("102010000000000516", ["Recovery Of Debts And Bankruptcy Act, 1993", "fema-banking-insurance"]);
        acts.set("102010000000000576", ["Securitisation And Reconstruction Of Financial Assets And Enforcement Of Security Interest Act, 2002", "fema-banking-insurance"]);

        acts.set("102010000000005389", ["Insolvency and Bankruptcy Code, 2016", "ibc"]);

        acts.set("102010000000000124", ["Competition Act, 2002", "competition-law"]);

        acts.set("102010000000005652", ["Andhra Pradesh Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005640", ["Assam Goods and Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005632", ["Bihar Goods & Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005651", ["Chhattisgarh Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005574", ["Central Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005641", ["Delhi Goods and Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005637", ["Goa Goods and Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005575", ["Goods And Services Tax (Compensation To States) Act, 2017", "gst-new"]);
        acts.set("102010000000005659", ["Gujarat Goods And Services Tax Act 2017", "gst-new"]);
        acts.set("102010000000005639", ["Haryana Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005634", ["Himachal Pradesh Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005576", ["Integrated Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005649", ["Jharkhand Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005657", ["Karnataka Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005656", ["Kerala Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005650", ["Madhya Pradesh Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005636", ["Maharashtra Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005644", ["Odisha Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005655", ["Punjab Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005615", ["Rajasthan Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005654", ["Tamil Nadu Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005633", ["Telangana Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005577", ["Union Territory Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005638", ["Uttar Pradesh Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005661", ["Uttarakhand Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000005647", ["West Bengal Goods And Services Tax Act, 2017", "gst-new"]);
        acts.set("102010000000000499", ["Prevention of Money Laundering Act, 2002", "gst-new"]);

        return acts;
    }

    public static CirnotOtherActs(): { [key: string]: string[] } {
        const acts: { [key: string]: string[] } = {};

        acts["999999999999999999"] = ["otheract", "direct-tax-laws,company-and-sebi,fema-banking-insurance,international-tax,transfer-pricing"];

        return acts;
    }


    public static customTrimStart(input: string, chars?: string): string {
        const charRegExp = chars ? new RegExp(`^[${chars}]+`) : /^\s+/;
        return input.replace(charRegExp, '');
    }

    public static ArticlePopularActs(): { [key: string]: string[] } {
        const acts: { [key: string]: string[] } = {};

        acts["102010000000000337"] = ["Income-tax Act, 1961", "direct-tax-laws,international-tax,transfer-pricing"];
        acts["102010000000000344"] = ["Income-Tax Rules, 1962", "direct-tax-laws"];
        acts["102010000000000672"] = ["Wealth-Tax Act, 1957", "direct-tax-laws"];
        acts["102010000000000045"] = ["Prohibition of Benami Property Transactions Act, 1988", "direct-tax-laws"];
        ///////////////////////////////////////////
        acts["102010000000005574"] = ["Central Goods And Services Tax Act, 2017", "gst-new"];
        acts["102010000000005575"] = ["Goods And Services Tax (Compensation To States) Act, 2017", "gst-new"];
        acts["102010000000005576"] = ["Integrated Goods And Services Tax Act, 2017", "gst-new"];
        acts["102010000000005655"] = ["Punjab Goods And Services Tax Act, 2017", "gst-new"];

        return acts;
    }

    public static ArticleOtherActs(): { [key: string]: string[] } {
        const acts: { [key: string]: string[] } = {};

        acts["999999999999999999"] = ["otheract", "direct-tax-laws,international-tax,transfer-pricing"];

        return acts;
    }

    public static UploadAuthorsImageOnAmazonS3Bucket(destid: string, imgsrcPath: string): void {
        const fileName: string = path.basename(imgsrcPath);
        // const objupload: AmazonS3Uploader = new AmazonS3Uploader();
        // objupload.UploadImage(`${ConfigurationSettings.AppSettings.s3imageBucket}${destid}`, fileName, imgsrcPath);
    }

    public static pdfFileManagementiReader(MID: string, FilePath: string | undefined, Type: string): string {
        if (FilePath.toLowerCase().indexOf('.pdf') !== -1) {
            if (Type && Type.toLowerCase() === 'instruction') {
                MID = MID + '_' + Type + '.pdf';
            } else {
                MID = MID + '.pdf';
            }

            const ROOTPath: string = System.Configuration.ConfigurationManager.AppSettings['FilePath'];
            const NEWPath: string = System.Configuration.ConfigurationManager.AppSettings['iReaderPdfPath'];

            if (!fs.existsSync(NEWPath)) {
                fs.mkdirSync(NEWPath, { recursive: true });
            }

            if (fs.existsSync(ROOTPath + FilePath)) {
                fs.copyFileSync(ROOTPath + FilePath, NEWPath + MID);
            }
        } else {
            MID = FilePath;
        }

        return MID;
    }


}

function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape characters for use in a regular expression
}
