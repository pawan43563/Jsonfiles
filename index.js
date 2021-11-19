const axios = require('axios');
const express = require("express")
const app=express()
app.use(express.json())
const { managementToken, apiKey, baseUrl, sourceLocale, targetLocale, contentTypeUid, workflowStageUid, projectId, userIdentifier, userSecret } = process.env;
let fileUri, entryUid;

const contentstackAxios = axios.create({
  baseURL: baseUrl
});
const smartlingAxios = axios.create({
  baseURL: 'https://api.smartling.com'
});


const updateEntry = ((uid, entry) => {
  let options = {
    method: 'PUT',
    url: `/v3/content_types/${contentTypeUid}/entries/${uid}?locale=${targetLocale}`,
    data: { "entry": entry },
    json: true,
    headers: {
      "content-Type": "application/json",
      Authorization: managementToken,
      api_key: apiKey
    }
  };
  return contentstackAxios(options);
});

const updateEntryWorkflow = ((uid) => {
  let options = {
    method: 'POST',
    url: `/v3/content_types/${contentTypeUid}/entries/${uid}/workflow?locale=${targetLocale}`,
    data: { "workflow": { "workflow_stage": { "uid": workflowStageUid, "assigned_to": [], "assigned_by_roles": "", "comment": "", "due_date": "", "notify": false } } },
    json: true,
    headers: {
      "content-Type": "application/json",
      Authorization: managementToken,
      api_key: apiKey
    }
  };
  return contentstackAxios(options);
});

const authenticate = () => {
  let options = {
    method: 'POST',
    url: `/auth-api/v2/authenticate`,
    json: true,
    headers: {
      "content-Type": "application/json",
    },
    data: {
      "userIdentifier": userIdentifier,
      "userSecret": userSecret
    },
  };
  return smartlingAxios(options);
}

const downloadFile = async (fileUri) => {
  let authenticationResponse = await authenticate();
  let token = authenticationResponse.data.response.data.accessToken;
  let options = {
    method: 'GET',
    url: `/files-api/v2/projects/${projectId}/locales/${targetLocale}/file?fileUri=${fileUri}`,
    json: true,
    headers: {
      Authorization: 'Bearer ' + token,
    }
  };
  return smartlingAxios(options);
}

const translate = async (entryUid) => {
  try {

    let translatedData = await downloadFile(fileUri);
    console.log('Translated Data', translatedData.data);
    await updateEntry(entryUid, translatedData.data)
    await updateEntryWorkflow(entryUid)
  
    return Promise.resolve();
  } catch (e) {
    return Promise.reject(e);
  }
};

exports.handler = async (event) => {
  console.log(event, event.queryStringParameters)

  try {
    entryUid = event.queryStringParameters.entryUid;
    fileUri = event.queryStringParameters.fileUri;
    await translate(entryUid);
    return {
      statusCode: 200,
      body: JSON.stringify({ "message": "Entry Updated & Translated" }),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ "error": e.message }),
    };
  }
};
app.post('/',async (req,res)=>{
  console.log(req);


})


app.listen(8000,()=>{
  console.log("Server Started succesfully at port no. 8000");
})