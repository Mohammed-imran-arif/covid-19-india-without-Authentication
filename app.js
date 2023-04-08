const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const intizaliationOfDbandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`database error is ${error}`);
    process.exit(1);
  }
};
intizaliationOfDbandServer();

//API 1 GET Method Returns a list of all states in the state table

const convertStateDbobjectApi1 = (ObjectItem) => {
  return {
    stateId: ObjectItem.state_id,
    stateName: ObjectItem.state_name,
    population: ObjectItem.population,
  };
};
//API 1
app.get("/states/", async (request, response) => {
  const getstateObjectQuery = `select * from state;`;
  const getstateObjectQueryResponse = await db.all(getstateObjectQuery);
  response.send(getstateObjectQueryResponse.map((each) => convertStateDbobjectApi1(each)));
});

//API 2 Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getstateByIdQuery = `select * from state where state_id = ${stateId};`;
  const getstateByIdQueryResponse = await db.get(getstateByIdQuery);
  response.send(convertStateDbobjectApi1(getstateByIdQueryResponse));
});

//API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `insert into district(district_name,state_id,cases,cured,active,deaths)
     values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const createDistrictQueryResponse = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//API 4
const convertDistrictQuery = (ObjectItem) => {
  return {
    districtId: ObjectItem.district_id,
    districtName: ObjectItem.district_name,
    stateId: ObjectItem.state_id,
    cases: ObjectItem.cases,
    cured: ObjectItem.cured,
    active: ObjectItem.active,
    deaths: ObjectItem.deaths,
  };
};

app.get("/districts/:districtId/", async (response, request) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    select * from district where district_id=${districtId};`;
  const getDistrictQueryResponse = await db.get(getDistrictQuery);
  response.send(getDistrictQueryResponse.map((each) => convertDistrictQuery(each)));
});

//api 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `delete from district where district_id = ${districtId};`;
  const deleteDistrictQueryResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//api 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `update district set
    district_name='${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths=${deaths} where district_id = ${districtId};`;

  const updateDistrictQueryResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//api 7  get
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `select sum(cases) as totalCases,sum(cured) as totalCured, sum(active) as totalActive,sum(deaths) as totalDeaths from district
    where state_id=${stateId};`;
  const getStateIdQueryResponse = await db.get(getStateIdQuery);
  response.send(getStateIdQueryResponse);
});

//api 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getdistrictIdQuery = `select state_id from district where district_id=${districtId};`;
  const getdistrictIdQueryResponse = await db.get(getdistrictIdQuery);

  const getStateNameQuery = `select state_name as stateName from state where state_id=${getdistrictIdQueryResponse.state_id}`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
