#!/usr/bin/env node

import chalk from 'chalk'
import { Command, Option } from 'commander'
import { CloudProvider, Output, OutputFormats } from './constants'
import CloudChiprCliProvider from './cli/cloud-chipr-cli-provider'
import { LoggerHelper, OutputHelper } from './helpers'
require('dotenv').config({path: `${__dirname}/../.env`})

const command = new Command()
command
  .description('Cloudchipr-cli (c8r) is a command line tool to help users collect, identify, filter and clean cloud resources in order to reduce resource waste and optimize cloud cost.')
  .addOption(new Option('--cloud-provider <cloud-provider>', 'Cloud provider').default(CloudProvider.AWS).choices(Object.values(CloudProvider)))
  .addOption(new Option('--verbose', 'Verbose'))
  .addOption(new Option('--version <version>', 'Version'))
  .addOption(new Option('--output <output>', 'Output').default(null).choices(Object.values(Output)))
  .addOption(new Option('--output-format <output-format>', 'Output format').default(OutputFormats.TABLE).choices(Object.values(OutputFormats)))
  .showSuggestionAfterError()

const collect = command
  .command('collect')
  .description('Connects to the user\'s cloud account(s) and collects resource information including a big variety of attributes and metadata about a given resource.\nThis data is meant to be filtered based on different criteria focused around identifying usage and reducing cloud cost by eliminating unused resources.')

const clean = command
  .command('clean')
  .description('Connects to the user\'s cloud account(s) and permanently terminates resources identified by the user\'s configuration of filters.\nIt\'s best used as a follow up to `collect` command, which allows users to identify costly unused resources.')

const cloudChiprCli = CloudChiprCliProvider.getProvider(command.opts().cloudProvider)
cloudChiprCli
  .customiseCommand(command)
  .customiseCollectCommand(collect)
  .customiseCleanCommand(clean)

try {
  command.parseAsync(process.argv).catch(e => {
    const filename = `${__dirname}/../.c8r/logs/${(new Date()).toISOString().slice(0, 10)}.log`
    LoggerHelper.logFile(filename, e.message, e)
    if (command.getOptionValue('verbose') === true) {
      OutputHelper.text(`Error: Failed on executing command due to: ${e.message}. \nThe trace log can be found in ${filename} directory.`, 'failure')
      OutputHelper.text(chalk.red(e.stack))
    } else {
      OutputHelper.text('Error: Failed on executing command, please run c8r with --verbose flag and follow the trace log.', 'failure')
    }
  })
} catch (e) {
  const filename = `${__dirname}/../.c8r/logs/${(new Date()).toISOString().slice(0, 10)}.log`
  LoggerHelper.logFile(filename, e.message, e)
  OutputHelper.text(`Error: Failed on executing command due to: ${e.message}. \nThe trace log can be found in ${filename} directory.`, 'failure')
}
