import Layout from "@theme/Layout";
import React from "react";


    //   export default () => {
    //     return <Layout />;
    //   };

// 'use strict';

// /**
//  * Copyright (c) 2017-present, Facebook, Inc.
//  *
//  * This source code is licensed under the MIT license found in the
//  * LICENSE file in the root directory of this source tree.
//  */

// const React = require('react');

// const CompLibrary = require('../../core/CompLibrary.js');

// const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
// const Container = CompLibrary.Container;

const HomeSplash = props => {
    const { siteConfig, language = '' } = props;
    const { baseUrl, customFields } = siteConfig;
    const { docsUrl } = customFields;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

    const SplashContainer = props => (
        <div className="homeContainer">
            <div className="homeSplashFade">
                <div className="wrapper homeWrapper">{props.children}</div>
            </div>
        </div>
    );

    const Logo = props => (
        <div className="projectLogo">
            <img src={props.img_src} alt="Project Logo" />
        </div>
    );

    const ProjectTitle = () => (
        <h2 className="projectTitle">
            {siteConfig.title}
            <small>{siteConfig.tagline}</small>
        </h2>
    );

    const PromoSection = props => (
        <div className="section promoSection">
            <div className="promoRow">
                <div className="pluginRowBlock">{props.children}</div>
            </div>
        </div>
    );

    const Button = props => (
        <div className="pluginWrapper buttonWrapper">
            <a className="button" href={props.href} target={props.target}>
                {props.children}
            </a>
        </div>
    );

    return (
        <SplashContainer>
            <Logo img_src={`${baseUrl}img/logo.png`} />
            <div className="inner">
                <ProjectTitle siteConfig={siteConfig} />
                <PromoSection>
                    <Button href={docUrl('overview.html')}>Overview</Button>
                    <Button href={docUrl('getting-started.html')}>Getting Started</Button>
                    <Button href={docUrl('development/overview.html')}>Development</Button>
                </PromoSection>
            </div>
        </SplashContainer>
    );
}

const Index = props => {
    const { config: siteConfig, language = '' } = props;

    const Description = () => (
        <Layout title="" description="">
            <div padding={['bottom', 'top']} id="description" background="light">

            </div>
        </Layout>
    );

    return (
        <Layout
            title="My Page"
            description="Description of my page">
            {/* <header>
                <h1>My Page</h1>
            </header> */}
            <main>
                <div padding={['bottom', 'top']} id="description" background="light">
                    <HomeSplash siteConfig={siteConfig} language={language} />
                </div>
            </main>
        </Layout>
        // <div>
        //     <div className="mainContainer">
        //         <HomeSplash siteConfig={siteConfig} language={language} />
        //         <Description />
        //     </div>
        // </div>
    );
}

export default Index;
