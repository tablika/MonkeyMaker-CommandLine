require "spaceship";
Spaceship.login(ARGV[0], ARGV[1]);
Spaceship.provisioning_profile.all.each do |profile|
  File.write(File.expand_path('~/Library/MobileDevice/Provisioning Profiles/'+profile.uuid+'.mobileprovision'), profile.download)
  puts profile
end
