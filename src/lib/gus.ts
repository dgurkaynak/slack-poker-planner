import logger from './logger';
import TurndownService from 'turndown';

const jsforce = require('jsforce');


export let access_token: string = process.env.ACCESS_TOKEN;

export function new_connection(token:string) {
  return new jsforce.Connection(
    {
      version: '50.0',
      accessToken: token,
      instanceUrl: process.env.INSTANCE_URL
    });
}

export function url(name: string, workId: string): string {
  return `<${client.instanceUrl}/${workId}|${name}>`;
}

let client = new_connection(access_token);

export function getConnection() {
  return client;
}

export function update_client(access_token:string) {
  logger.info(`in update_client: with access token ${access_token}`);
  client = new_connection(access_token);
}

export interface IGusRecord {
  Id: string;
  Details__c: string;
  Name: string;
  Subject__c: string;
  Sprint_Name__c: string;
}

export async function getRecord(title: string, connection = getConnection()): Promise<IGusRecord> {
  let record: IGusRecord;

  logger.info(`Connection is ${connection}, with access token ${connection.accessToken}`);
  await connection.query(`SELECT Id, Subject__c, Details__c, Sprint_Name__c, Name FROM ADM_Work__c WHERE Name='${title}'`,
    function(err: any, result: any) {
      if (err) {
        return logger.error(err);
      }
      logger.info("total : " + result.totalSize);
      logger.info("fetched : " + result.records.length);
      logger.info("done ? : " + result.done);
      if (!result.done) {
        // you can use the locator to fetch next records set.
        // Connection#queryMore()
        logger.info("next records URL : " + result.nextRecordsUrl);
      }
      logger.info(result.records[0]);

      record = <IGusRecord> result.records[0];

      // strip html tag and convert it to markdown
      record.Details__c = new TurndownService().turndown(record.Details__c);
    }
  );
  return record;
}

// Find the closest Fibonacci number, given number `n`
export function fib(n: number, x:number=0, y:number=1):number {
  if (y < n) {
    return fib(n, y, x + y);
  } else {
    if (y - n > n - x) {
      return x;
    } else {
      return y;
    }
  }
}

export async function reportStoryPoints(average: string, workId: string): Promise<void> {
  const fibAverage : number = fib(Number(average));
  logger.info("In reportStoryPoints: avg " + fibAverage + " work ID: " + workId);
  await getConnection().sobject("ADM_Work__c").update({
    Id : workId,
    Story_Points__c : fibAverage
  }, function(err: any, ret: any) {
    if (err || !ret.success) { return "ERROR Updating GUS: " + logger.error(err); }

    logger.info(`SUCCESS Updating GUS: avg=${average}, fibAvg=${fibAverage}, workId=${workId}`);
  });
}
