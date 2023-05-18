module.exports = {
  packagerConfig: {
    icon: '/assets/images/logo'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        options: {
          iconUrl: 'https://raw.githubusercontent.com/gibinfrancis/DataWave/main/assets/images/logo.ico',
          setupIcon: '/assets/images/logo.ico',
          icon: '/assets/images/logo'
        }
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
      config: {
        options: {
          icon: '/assets/images/logo.png'
        }
      },
    },
  ],
};
