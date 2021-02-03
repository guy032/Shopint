async function detectWeb(fileName) {
    // [START vision_web_detection]

    // Imports the Google Cloud client library
    const vision = require('@google-cloud/vision');

    // Creates a client
    const client = new vision.ImageAnnotatorClient();

    /**
     * TODO(developer): Uncomment the following line before running the sample.
     */
    // const fileName = 'Local image file, e.g. /path/to/image.png';

    // Detect similar images on the web to a local file
    const [result] = await client.webDetection(fileName);
    const webDetection = result.webDetection;
    if (webDetection.fullMatchingImages.length) {
        console.log(`Full matches found: ${webDetection.fullMatchingImages.length}`);
        webDetection.fullMatchingImages.forEach((image) => {
            console.log(`  URL: ${image.url}`);
            console.log(`  Score: ${image.score}`);
        });
    }

    if (webDetection.partialMatchingImages.length) {
        console.log(`Partial matches found: ${webDetection.partialMatchingImages.length}`);
        webDetection.partialMatchingImages.forEach((image) => {
            console.log(`  URL: ${image.url}`);
            console.log(`  Score: ${image.score}`);
        });
    }

    if (webDetection.webEntities.length) {
        console.log(`Web entities found: ${webDetection.webEntities.length}`);
        webDetection.webEntities.forEach((webEntity) => {
            console.log(`  Description: ${webEntity.description}`);
            console.log(`  Score: ${webEntity.score}`);
        });
    }

    if (webDetection.bestGuessLabels.length) {
        console.log(`Best guess labels found: ${webDetection.bestGuessLabels.length}`);
        webDetection.bestGuessLabels.forEach((label) => {
            console.log(`  Label: ${label.label}`);
        });
    }
    // [END vision_web_detection]
}

async function detectWebGCS(bucketName, fileName) {
    // [START vision_web_detection_gcs]

    // Imports the Google Cloud client libraries
    const vision = require('@google-cloud/vision');

    // Creates a client
    const client = new vision.ImageAnnotatorClient();

    /**
     * TODO(developer): Uncomment the following lines before running the sample.
     */
    // const bucketName = 'Bucket where the file resides, e.g. my-bucket';
    // const fileName = 'Path to file within bucket, e.g. path/to/image.png';

    // Detect similar images on the web to a remote file
    const [result] = await client.webDetection(`gs://${bucketName}/${fileName}`);
    const webDetection = result.webDetection;
    if (webDetection.fullMatchingImages.length) {
        console.log(`Full matches found: ${webDetection.fullMatchingImages.length}`);
        webDetection.fullMatchingImages.forEach((image) => {
            console.log(`  URL: ${image.url}`);
            console.log(`  Score: ${image.score}`);
        });
    }

    if (webDetection.partialMatchingImages.length) {
        console.log(`Partial matches found: ${webDetection.partialMatchingImages.length}`);
        webDetection.partialMatchingImages.forEach((image) => {
            console.log(`  URL: ${image.url}`);
            console.log(`  Score: ${image.score}`);
        });
    }

    if (webDetection.webEntities.length) {
        console.log(`Web entities found: ${webDetection.webEntities.length}`);
        webDetection.webEntities.forEach((webEntity) => {
            console.log(`  Description: ${webEntity.description}`);
            console.log(`  Score: ${webEntity.score}`);
        });
    }

    if (webDetection.bestGuessLabels.length) {
        console.log(`Best guess labels found: ${webDetection.bestGuessLabels.length}`);
        webDetection.bestGuessLabels.forEach((label) => {
            console.log(`  Label: ${label.label}`);
        });
    }
    // [END vision_web_detection_gcs]
}

async function detectWebGeo(fileName) {
    // [START vision_web_detection_include_geo]
    // Imports the Google Cloud client library
    const vision = require('@google-cloud/vision');

    // Creates a client
    const client = new vision.ImageAnnotatorClient();

    /**
     * TODO(developer): Uncomment the following line before running the sample.
     */
    // const fileName = 'Local image file, e.g. /path/to/image.png';

    const request = {
        image: {
            source: {
                filename: fileName,
            },
        },
        imageContext: {
            webDetectionParams: {
                includeGeoResults: true,
            },
        },
    };

    // Detect similar images on the web to a local file
    const [result] = await client.webDetection(request);
    const webDetection = result.webDetection;
    webDetection.webEntities.forEach((entity) => {
        console.log(`Score: ${entity.score}`);
        console.log(`Description: ${entity.description}`);
    });
    // [END vision_web_detection_include_geo]
}

async function detectWebGeoGCS(bucketName, fileName) {
    // [START vision_web_detection_include_geo_gcs]
    // Imports the Google Cloud client library
    const vision = require('@google-cloud/vision');

    // Creates a client
    const client = new vision.ImageAnnotatorClient();

    /**
     * TODO(developer): Uncomment the following lines before running the sample.
     */
    // const bucketName = 'Bucket where the file resides, e.g. my-bucket';
    // const fileName = 'Path to file within bucket, e.g. path/to/image.png';

    const request = {
        image: {
            source: {
                imageUri: `gs://${bucketName}/${fileName}`,
            },
        },
        imageContext: {
            webDetectionParams: {
                includeGeoResults: true,
            },
        },
    };

    // Detect similar images on the web to a remote file
    const [result] = await client.webDetection(request);
    const webDetection = result.webDetection;
    webDetection.webEntities.forEach((entity) => {
        console.log(`Score: ${entity.score}`);
        console.log(`Description: ${entity.description}`);
    });
    // [END vision_web_detection_include_geo_gcs]
}

async function quickstart() {
    const response = await detectWeb('./resources/fox.jpg');
    console.log(response);
}
quickstart();
