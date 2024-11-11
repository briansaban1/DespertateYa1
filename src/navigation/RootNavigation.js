import { CommonActions } from '@react-navigation/native';
import * as React from 'react';

let navigator = null;
/*
[
    'goBack',
    'navigate',
    'reset',
    'setParams',
    'addListener',
    'removeListener',
    'resetRoot',
    'dispatch',
    'canGoBack',
    'getRootState',
    'dangerouslyGetState',
    'dangerouslyGetParent',
    'getCurrentRoute',
    'getCurrentOptions'
]
*/

function navigate(name, params = {}) {
  navigator?.navigate(name, params);
}

export function reset(name, params = {}) {
  navigator?.reset({
    index: 0,
    routes: [{name, params}],
  });
}

export function goBack() {
  if (navigator?.canGoBack()) {
    navigator?.goBack();
  }
}

function setTopLevelNavigator(navigationRef){
  navigator = navigationRef;
}

export default {setTopLevelNavigator, navigate};