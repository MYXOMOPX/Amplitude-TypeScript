import { BeforePlugin, BrowserClient, BrowserConfig, Event } from '@amplitude/analytics-types';
import { CreateWebAttributionPlugin, Options } from './typings/web-attribution';
import { isNewSession } from '@amplitude/analytics-client-common';
import { WebAttribution, isNewCampaign } from '@amplitude/analytics-browser';

export const webAttributionPlugin: CreateWebAttributionPlugin = function (options: Options = {}) {
  const plugin: BeforePlugin = {
    name: '@amplitude/plugin-web-attribution-browser',
    type: 'before',

    setup: async function (config: BrowserConfig, amplitude: BrowserClient) {
      const webAttribution = new WebAttribution(options, config);
      await webAttribution.init();

      const pluginConfig = webAttribution.options;
      const currentCampaign = webAttribution.currentCampaign;
      const previousCampaign = webAttribution.previousCampaign;

      const isEventInNewSession = isNewSession(config.sessionTimeout, config.lastEventTime);

      if (isNewCampaign(currentCampaign, previousCampaign, pluginConfig, isEventInNewSession)) {
        if (pluginConfig.resetSessionOnNewCampaign) {
          amplitude.setSessionId(Date.now());
          config.loggerProvider.log('Created a new session for new campaign.');
        }
        config.loggerProvider.log('Tracking attribution.');
        const campaignEvent = webAttribution.generateCampaignEvent();
        amplitude.track(campaignEvent);
      }
    },

    execute: async (event: Event) => event,
  };

  return plugin;
};
