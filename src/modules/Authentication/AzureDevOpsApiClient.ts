import { AzureDevOps } from '../../types';

export abstract class AzureDevOpsApiClient {
  static async getUserOrganizations(accessToken: string, userAlias: string) {
    const results = await Promise.all([
      fetch(`https://app.vssps.visualstudio.com/_apis/accounts?ownerId=${userAlias}&api-version=7.1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`https://app.vssps.visualstudio.com/_apis/accounts?memberId=${userAlias}&api-version=7.1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
      }),
    ]);

    const [ownerOrganizations, memberOrgs] = await Promise.all([results[0].json(), results[1].json()]) as AzureDevOps.OrganizationApiResponse[];

    return {
      ownerOrganizations: ownerOrganizations.value,
      memberOrgs: memberOrgs.value.filter(x => ownerOrganizations.value.find(y => y.accountId === x.accountId) === undefined),
    };
  }

  static async getUserProfile(accessToken: string): Promise<any> {
    const res = await fetch(`https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.1-preview.1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
    });
    return res.json();
  }
}