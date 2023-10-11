# LinkedIn Skill-Based Content Posting Bot

The LinkedIn Skill-Based Content Posting Bot is a Node.js application built with Puppeteer to automate the daily posting of content on LinkedIn. This bot logs in to LinkedIn, gathers user's skills from their profile, and posts content based on those skills. Please use this bot responsibly, respecting LinkedIn's terms of service and ethical considerations.

> [!NOTE]
> Sometimes linkedin sends wrong response, so if you are 100% sure that your email and password are correct then re-run the program.

## Features

- **Automated Daily Content Posting**: Post content on LinkedIn every day based on user's skills.
- **Skill-Based Targeting**: Post content relevant to the skills listed on user's profile.
- **LinkedIn Login**: Securely log in to your LinkedIn account using Puppeteer.
- **Error Handling**: Robust error handling to ensure the bot operates smoothly.
- **GitHub Repository**: Accessible GitHub repository for your bot.

## Getting Started

1. **Prerequisites:**
    - [Node.js](https://nodejs.org/en/download/current) (Latest Version)

2. **Clone the Repository:**
    ```shell
    git clone https://github.com/AdarshKr357/LinkedIn-Skill-Based-Content-Posting-Bot.git
    ```
    ```shell
    cd LinkedIn-Skill-Based-Content-Posting-Bot
    ```

3. **Install Dependencies:**
    ```shell
    npm install dotenv
    ```
    ```shell
    npm install axios
    ```
    ```shell
    npm install puppeteer-extra
    ```
    ```shell
    npm install puppeteer-extra-plugin-stealth
    ```

4. **Configuration:**
    - Create a ```.env``` file in the project root directory (app.js directory).
    - Configure the bot's settings in ```config.js```. You can specify the skills manually or let the program log in to your account and gather skills from their automatically.

5. Run the Bot
    ```shell
    node app.js
    ```

The bot will automatically log in to LinkedIn, gather user's skills, and post content everyday.

## Important Notes
- Respect LinkedIn's Terms of Service and use this bot responsibly.
- Ensure the content you share complies with LinkedIn's guidelines and regulations.
- Monitor the bot's activity to ensure content is posted as expected.

## Extra
- You can visit [scripai](https://scripai.com/linkedin-post) for extra information regarding content posting of linkedin and data for ```config.js```.
- You can also use [mention](https://mention.com/en/linkedin-post-generator/) api to generate linkedIn post's content.

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please follow the standard GitHub fork and pull request workflow.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Disclaimer
This project is for educational purposes and should be used responsibly and ethically. The authors of this project are not responsible for any misuse or violations of LinkedIn's terms and conditions.

For any questions, feedback, or issues, please contact me at ```adarshkr357@gmail.com``` or connect on [LinkedIn](https://www.linkedin.com/in/adarshkr357/).

[![](https://img.shields.io/badge/Made%20With%20%E2%9D%A4%EF%B8%8F%20By-Adarsh-red)](https://github.com/adarshkr357)
