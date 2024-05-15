/**
 * Title: 302 Redirect Chasing Sample - Single Redirect
 * Description: AWS Lambda at the Edge function that can be placed
 *              on Origin Request that will chase a single redirect
 * Author: Sam Patzer <sampatze@amazon.com>
 * Version: 0.1.0
 */

import fetch from 'node-fetch';

export const handler = async (event) => {
  // Pull request info from the AWS Lambda event
  // Event structure can be found here:
  // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#lambda-event-structure-request
  const request = event.Records[0].cf.request;
  const host = request.headers.host[0].value;
  const uri = request.uri;

  // Make the initial request
  const initialResponse = await fetch(`https://${host}${uri}`, {
    method: request.method,
    body: request.body,
    // Forces fetch to not chase the redirect
    redirect: 'manual',
  });

  // Check if the response has a 302 status code
  if (initialResponse.status === 302) {
    // Extract the location header from the response
    const location = initialResponse.headers.get('location');

    if (location) {

      // Forward the request to the new location
      const newRequest = {
        method: request.method,
        body: request.body,
        headers: {
          // Request only first byte to validate
          'Range': 'bytes=0-0' 
        }
      };

      // Make the request to the new location
      const response = await fetch(location, newRequest);

      if (response.status === 206 || response.status === 200) {
        const parsedUrl = new URL(location);

        // Pass the path to request.uri
        // Can also use request.origin.custom.path
        // Only use one or the other though as they both append
        request.uri = parsedUrl.pathname;

        // URL uses .search for query params
        if(parsedUrl.search !== undefined || parsedUrl.search !== '' ){
          // AWS CloudFront requests append a '?' so we remove it here
          request.querystring = parsedUrl.search.slice(1);
        }

        // Have to add host to both headers.host & origin.custom.domainName
        request.headers.host[0].value = parsedUrl.host;
        if (request.origin && request.origin.custom) {
          request.origin.custom.domainName = parsedUrl.host;
        }

        // If 206/200, return the chased redirect
        return request;
      }
      // If no 206/200 then just return original request
      return request;
    }
  }

  // If no redirect, return the original response
  return request;
};