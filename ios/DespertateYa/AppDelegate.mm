#import "AppDelegate.h"

#import <Firebase.h>
#import <React/RCTBridge.h>
#import <GoogleMaps/GoogleMaps.h>
#import "RNNotifications.h"
#import "React/RCTBridgeModule.h"
#import "RNNotifications.h"
#import <AVFoundation/AVFoundation.h>

#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{

  NSError *error = nil;
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback
                                        withOptions:AVAudioSessionCategoryOptionMixWithOthers
                                            error:&error];
  if (error) {
    NSLog(@"Error configuring AVAudioSession: %@", error);
  }

  [[AVAudioSession sharedInstance] setActive:YES error:nil];

    [RNNotifications startMonitorNotifications]; // -> Add this line
    [GMSServices provideAPIKey:@"AIzaSyArvvnFtti11jh_qdmuVKQCIDet2UBuByc"]; // add this line using the api key obtained from Google Console
    [FIRApp configure];


  self.moduleName = @"DespertateYa";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [RNNotifications didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  [RNNotifications didFailToRegisterForRemoteNotificationsWithError:error];
}
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler {
  [RNNotifications didReceiveBackgroundNotification:userInfo withCompletionHandler:completionHandler];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
