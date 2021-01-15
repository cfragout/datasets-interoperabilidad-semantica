fs = require('fs');
xml2js = require('xml2js');
commandLineArgs = require('command-line-args');


// program parameters
const optionDefinitions = [
  { name: 'agrovoc', alias: 'a', type: String },
  { name: 'input', alias: 'i', type: String },
  { name: 'output', alias: 'o', type: String }
];
const options = commandLineArgs(optionDefinitions);

const lmroNamespace = 'http://www.lifia.info.unlp.edu.ar/lmro#';
const DATASET = options.input || 'dataset.rdf';
const OUTPUT = options.output || 'dataset-with-post-build-stage.rdf';



if (!options.agrovoc) {
    console.log('No se especificó archivo de AGROVOC');
    return;
}


var rdfAgrovocContent;


// read files
const promises = [
    readFromFile(DATASET),
    readFromFile(options.agrovoc),
];

Promise.all(promises).then(result => {
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();
    const data = result[0];
    const agrovocStr = result[1];



    parser.parseString(agrovocStr, function (err, agrovoc) {
        rdfAgrovocContent = agrovoc['rdf:RDF'];


















        parser.parseString(data, function (err, result) {
            const rdfContent = result['rdf:RDF'];

            rdfContent['rdf:Description'].forEach(term => {

                // if (term['lmro:appliesTo']) {
                //     resolveAGROVOCLabel(term);
                // }

                if (term['lmro:hasValue']) {
                    replaceExento(term);
                }

 

            });


            const xml = builder.buildObject(result);
            fs.writeFile(OUTPUT, xml, function (err,data) {
                if (err) {
                    return console.log(err);
                }
                console.log(`Se creo el archivo ${OUTPUT}`);
            });


        });
    });

});

// replace the string EXENTO and add the appropriate concept
function replaceExento(term) {
    const EXENTO = 'exento';

    if (term['lmro:hasValue'][0]['_'].toLowerCase() === EXENTO) {
        console.log(term)
    }
}

// replace AGROVOC label resource with the actual concept
function resolveAGROVOCLabel(term) {
    const resource = term['lmro:appliesTo'][0]['$']['rdf:resource'];

    rdfAgrovocContent['rdf:Description'].forEach(agTerm => {
        if (agTerm['$']['rdf:about'] === resource) {

            if (agTerm['notation']) {
                term['lmro:appliesTo'][0]['$']['rdf:resource'] = asAGROVOCConcept(agTerm['notation'][0]['_']);
            }

            if (agTerm['literalForm']) {
                term['rdf:label'] = agTerm['literalForm'][0]['_'];
            }
        }
    });

    return term;
}


function readFromFile(file, format = '') {
    return new Promise((resolve, reject) => {
        fs.readFile(file, format, function (err, data) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function asAGROVOCConcept(str) {
    const _CONCEPT_PREFIX = 'c_';
    const _NAMESPACE = 'http://aims.fao.org/aos/agrovoc/';
    return _NAMESPACE + _CONCEPT_PREFIX + str;
}