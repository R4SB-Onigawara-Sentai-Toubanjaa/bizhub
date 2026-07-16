import { requireNativeModule } from 'expo-modules-core';

const ExpoBleAdvertiser = requireNativeModule('ExpoBleAdvertiser');

export async function startExchange(uuid: string, myToken: string): Promise<string> {
  return await ExpoBleAdvertiser.startExchange(uuid, myToken);
}

export async function stopExchange(): Promise<boolean> {
  return await ExpoBleAdvertiser.stopExchange();
}