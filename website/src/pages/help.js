import Layout from "@theme/Layout";
import React from "react";
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ReactMarkdown from "react-markdown";

function Help() {
  const { siteConfig } = useDocusaurusContext()
  const language = '';
  const { baseUrl, customFields } = siteConfig;
  const { docsUrl } = customFields;
  const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
  const langPart = `${language ? `${language}/` : ''}`;
  const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

  const GridBlock = ({ contents }) => {
    return (
      <div className="threeColumn">
        {contents.map((content, index) => (
          <div key={index} className="block">
            <h2>{content.title}</h2>
            <p><ReactMarkdown>{content.content}</ReactMarkdown></p>
          </div>
        ))}
      </div>
    );
  };

  const supportLinks = [
    {
    //   content: `Learn more using the <a href="${docUrl('overview.html')}">documentation on this site.</a>`,
      content: `Learn more using the [documentation on this site.](${docUrl(
        'overview.html',
      )})`,
      title: 'Browse Docs',
    },
    {
      content: '[Ask questions](https://github.com/terascope/teraslice/issues) about the documentation and project',
      title: 'Join the community',
    },
    {
      content: '[Find out](https://github.com/terascope/teraslice/releases) what\'s new with this project',
      title: 'Stay up to date',
    },
  ];

  return (
    <Layout title="Help" description="Help Page">
      <div className="docMainWrapper wrapper">
        <div className="mainContainer documentContainer postContainer">
          <div class="wrapper">
            <div className="post">
              <header className="postHeader">
                <h1>Need help?</h1>
              </header>
              <p>This project is maintained by a dedicated group of people.</p>
              <GridBlock contents={supportLinks}/>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Help;
