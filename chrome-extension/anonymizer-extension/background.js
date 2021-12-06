let TOKEN_EXPERT = 'SPQzULMPVtKMHxZaj7lt.lTfAjm7wuTWVC6EojlaF';

let ENTITIES_DEFAULT = ['NPH', 'DAT', 'COM', 'HOU', 'MAI', 'MON', 'ORG', 'PHO', 'VCL', 'WEB'];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ TOKEN_EXPERT });
  chrome.storage.sync.set({ 'CURRENT_ENTITIES': ENTITIES_DEFAULT });

  console.log(`Save token in storage TOKEN_EXPERT: ${TOKEN_EXPERT}`);
});
