// Chooses the streaming provider from station configuration (spec §23).
//
// Adding a new host means adding one entry here. Nothing else in the radio
// system needs to know which host is in use.

import type { StationStreamConfig } from './types';
import { NullStreamProvider, type StreamProvider } from './streamProvider';
import { Live365Provider } from './live365Provider';
import { GenericStreamProvider } from './genericProvider';

export const createStreamProvider = (config: StationStreamConfig | null): StreamProvider => {
  if (!config) {
    return new NullStreamProvider({
      stationId: '', provider: 'live365', providerStationId: null, streamUrl: null,
      playerUrl: null, metadataUrl: null, statusUrl: null, listenerCountUrl: null,
      fallbackArtworkUrl: null, stationTimezone: 'Europe/London', metadataPollSeconds: 20,
      isStreamEnabled: false, offlineMessage: null,
    });
  }

  switch (config.provider) {
    case 'live365':
      return new Live365Provider(config);
    case 'icecast':
      return new GenericStreamProvider('icecast', 'Icecast', config);
    case 'shoutcast':
      return new GenericStreamProvider('shoutcast', 'Shoutcast', config);
    case 'azuracast':
      return new GenericStreamProvider('azuracast', 'AzuraCast', config);
    case 'radioking':
      return new GenericStreamProvider('radioking', 'RadioKing', config);
    case 'custom':
      return new GenericStreamProvider('custom', 'Custom stream', config);
    default:
      return new NullStreamProvider(config);
  }
};
