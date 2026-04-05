import { ZoteroClient } from './zotero-client.js';

interface MetadataUpdate {
    key: string;
    itemType: string;
    title: string;
    creators?: { firstName: string; lastName: string; creatorType: string }[];
    date?: string;
    publicationTitle?: string;
    abstractNote?: string;
}

async function fixItem(client: ZoteroClient, update: MetadataUpdate) {
    console.log(`Fixing ${update.key}: ${update.title}`);
    
    // 1. Create the parent item
    const parentData: any = {
        itemType: update.itemType,
        title: update.title,
        creators: update.creators || [],
        date: update.date || '',
    };
    
    if (update.publicationTitle) {
        parentData.publicationTitle = update.publicationTitle;
    }
    
    const response = await client.createItem(parentData);
    // createItem returns an array of items in 'successful' property for multiple items, 
    // but the wrapper in zotero-client.ts might return them directly.
    // Let's check zotero-client.ts: it returns the raw data from request().
    const parent = response.successful ? Object.values(response.successful)[0] : response[0];
    const parentKey = (parent as any).key;
    
    console.log(`   Created Parent: ${parentKey}`);

    // 2. Move attachment to parent
    await client.reparentAttachment(update.key, parentKey);
    
    console.log(`   Moved attachment to ${parentKey}`);
}

async function main() {
    const client = new ZoteroClient();
    
    // Batch 1 (from snippets analysis)
    const updates: MetadataUpdate[] = [
        {
            key: "IKP4YZF6",
            itemType: "bookSection",
            title: "España: el complejo y accidentado tránsito de Imperio a Nación",
            creators: [{ firstName: "Julio", lastName: "Pérez Serrano", creatorType: "author" }],
            date: "2019"
        },
        {
            key: "KC5MJ8WI",
            itemType: "report",
            title: "Contextualización del sistema agroalimentario en Almería",
            creators: [{ firstName: "Aurora María", lastName: "Martínez Cintas", creatorType: "author" }],
            date: "2014"
        },
        {
            key: "DKFWIPMQ",
            itemType: "journalArticle",
            title: "Nota de la editora invitada",
            publicationTitle: "Revista Desarrollo y Sociedad",
            creators: [{ firstName: "Ana María", lastName: "Ibáñez", creatorType: "author" }],
            date: "2021"
        },
        {
            key: "U9QML5RH",
            itemType: "journalArticle",
            title: "Nota editorial",
            publicationTitle: "Revista Desarrollo y Sociedad",
            creators: [{ firstName: "Ana María", lastName: "Ibáñez", creatorType: "author" }],
            date: "2021"
        },
        {
            key: "2KW8MRYA",
            itemType: "thesis",
            title: "Modèles de pondération par les méthodes de tri croisé pour l’aide à la décision collaborative en projet",
            creators: [{ firstName: "Frej", lastName: "Limayem", creatorType: "author" }],
            date: "2001"
        },
        {
            key: "66ZJE92F",
            itemType: "report",
            title: "Les organisations internationales",
            creators: [{ firstName: "Hughes", lastName: "Brisson", creatorType: "author" }],
            date: "2012"
        },
        {
            key: "EV9ET425",
            itemType: "report",
            title: "Rapport d’activité 2006 de la Direction de la Population et des Migrations",
            date: "2006"
        },
        {
            key: "K3DD49CG",
            itemType: "report",
            title: "Communication de la Commission au Conseil et au Parlement Européen sur les politiques d'immigration et d'asile",
            date: "1994"
        },
        {
            key: "V2NAD3LV",
            itemType: "book",
            title: "Traité de relations internationales",
            creators: [
                { firstName: "Thierry", lastName: "Balzacq", creatorType: "editor" },
                { firstName: "Frédéric", lastName: "Ramel", creatorType: "editor" }
            ],
            date: "2013"
        },
        {
            key: "QRDCIKMH",
            itemType: "report",
            title: "Guide d'analyse économique - Évaluation économique intégrée au calcul de possibilités forestières",
            date: "2013"
        },
        {
            key: "WI6M3H2K",
            itemType: "book",
            title: "Diccionario Jurídico Elemental",
            creators: [{ firstName: "Guillermo", lastName: "Cabanellas de Torres", creatorType: "author" }],
            date: "1993"
        },
        {
            key: "TCBCQFEI",
            itemType: "bookSection",
            title: "Introduction - l'outillage mental des acteurs de l'économie",
            creators: [
                { firstName: "Jean-Claude", lastName: "Daumas", creatorType: "author" },
                { firstName: "Gérard", lastName: "Gayot", creatorType: "author" },
                { firstName: "Philippe", lastName: "Minard", creatorType: "author" },
                { firstName: "Didier", lastName: "Terrier", creatorType: "author" }
            ],
            date: "2009"
        },
        {
            key: "8MMXV7GZ",
            itemType: "book",
            title: "Manual jurídico para la defensa de las personas extranjeras en los centros de internamiento (CIE)",
            creators: [
                { firstName: "Cristina", lastName: "Almeida", creatorType: "author" },
                { firstName: "Julián", lastName: "Ríos", creatorType: "author" },
                { firstName: "Susana", lastName: "Cuesta", creatorType: "author" },
                { firstName: "Eduardo", lastName: "Santos", creatorType: "author" }
            ],
            date: "2020"
        },
        {
            key: "498Z4A8Y",
            itemType: "journalArticle",
            title: "Interrogating sustainable productivism: lessons from the ‘Almerían miracle’",
            publicationTitle: "Land Use Policy",
            creators: [
                { firstName: "Meri", lastName: "Juntti", creatorType: "author" },
                { firstName: "Stuart D.", lastName: "Downward", creatorType: "author" }
            ],
            date: "2017"
        },
        // Extranjería Chapters (Batch 3)
        ...[
            { key: "RRQFF4QW", num: "20", title: "Procedimientos" },
            { key: "FDHB993B", num: "21", title: "Servicios electrónicos de extranjería" },
            { key: "KU9RVXEV", num: "22", title: "Plazos" },
            { key: "XKEXNXMX", num: "23", title: "Inadmisión a trámite" },
            { key: "KV2MU4AW", num: "24", title: "Tasas" },
            { key: "LQGZ2UXC", num: "26", title: "Centros de internamiento" },
            { key: "4LG45JNH", num: "27 BIS", title: "Ciudadanos de Reino Unido e Irlanda del Norte" },
            { key: "8CBHUKX5", num: "00", title: "Presentación" },
            { key: "HJ2ELNLL", num: "02", title: "Derechos de los extranjeros" },
            { key: "8CL7F5V7", num: "04", title: "Entrada y salida del territorio español" },
            { key: "9VGAQFVM", num: "05", title: "Situación de estancia" },
            { key: "CD7T2YVU", num: "06", title: "Residencia temporal" },
            { key: "VBJUADM5", num: "07", title: "Residencia no lucrativa" },
            { key: "3CP4EGMF", num: "08", title: "Reagrupación familiar" },
            { key: "WLGTA6L2", num: "09", title: "Autorización de residencia temporal y autorización de trabajo" },
            { key: "UEVJS6R6", num: "10", title: "Autorización de residencia temporal por circunstancias excepcionales" },
            { key: "6IYC6N8D", num: "11 BIS", title: "Cómo prevenir la irregularidad sobrevenida" },
            { key: "G5NUVPQG", num: "12", title: "Gestión colectiva de contrataciones en origen" },
            { key: "9ZFITNMV", num: "13", title: "Razones de interés económico" },
            { key: "EJ54UJN7", num: "14", title: "Trabajadores transfronterizos" },
            { key: "LBTKS6CR", num: "15", title: "Menores extranjeros" },
            { key: "AMMQ52F8", num: "16", title: "Indocumentados" },
            { key: "ZX9HJHI2", num: "17", title: "Registro central de extranjeros" },
            { key: "EGU5V87D", num: "18", title: "Modificación de las situaciones" },
        ].map(it => ({
            key: it.key,
            itemType: "bookSection",
            title: `Capítulo ${it.num}: ${it.title}`,
            creators: [{ firstName: "Cristina", lastName: "Cáritas", creatorType: "author" }], // Based on snippet 18 and author field
            publicationTitle: "Manual jurídico de extranjería",
            date: "2020"
        })),
        {
            key: "WDZFKTXL",
            itemType: "journalArticle",
            title: "Revisiting Samuelson's Foundations of Economic Analysis",
            publicationTitle: "Journal of Economic Literature",
            creators: [{ firstName: "Roger", lastName: "Backhouse", creatorType: "author" }],
            date: "2015"
        },
        {
            key: "JX598DBD",
            itemType: "bookSection",
            title: "Procesos migratorios, economía y personas",
            creators: [{ firstName: "Horacio", lastName: "Capel", creatorType: "author" }],
            date: "2002"
        }
    ];

    for (const update of updates) {
        try {
            await fixItem(client, update);
            // Append to execution log
            fs.appendFileSync('./tier1_execution.log', `${update.key}\n`);
        } catch (e: any) {
            console.error(`Failed to fix ${update.key}: ${e.message}`);
        }
    }
}

import * as fs from 'fs';
main().catch(console.error);
