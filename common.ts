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


}

function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape characters for use in a regular expression
}
