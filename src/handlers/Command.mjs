import { REST, Routes } from "discord.js";
import { token, id } from "../../config.mjs";
import { pathToFileURL } from "url";
import { Filereader } from "./filereader.mjs";

export const CommandHandler = async (client, rootPath) => {
    const allFiles = await Filereader(`${rootPath}/src/commands`);
    const rest = new REST({ version: "10" }).setToken(token);

    const commands = await Promise.allSettled(allFiles.map(async (commandFile) => {
        try {
            const { Command } = await import(pathToFileURL(commandFile));
            if (Command && !Command.ignore && Command.name && Command.description) {
                client.slashCommands?.set(Command.name, Command);
                return {
                    name: Command.name,
                    description: Command.description,
                    type: 1,
                    options: Command.options ?? []
                };
            }
        } catch (error) {
            console.error(`Failed to load command from file: ${commandFile}`, error);
        }
        return null;
    }));

    const commandsArray = commands
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);

    try {
        console.log("Started refreshing application (/) commands.");
        await rest.put(
            Routes.applicationCommands(id),
            { body: commandsArray }
        );
        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error("Failed to refresh application commands:", error);
    }
};