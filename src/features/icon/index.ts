import {customElement, property} from 'lit/decorators.js';
import {LitElement, css, html, nothing} from 'lit';
import {until} from 'lit-html/directives/until.js';
import {unsafeSVG} from 'lit/directives/unsafe-svg.js';
import {IconName} from './icon-types';

type IconSize = 'small' | 'medium' | 'large';

@customElement('reveal-icon')
export default class Icon extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-block;
      }
      svg {
        display: block;
      }
      .small svg {
        width: 1rem; /* Adjust as needed */
        height: 1rem;
      }
      .medium svg {
        width: 1.5rem;
        height: 1.5rem;
      }
      .large svg {
        width: 2rem;
        height: 2rem;
      }
    `;
  }

  @property({type: String})
  public icon?: IconName;

  @property({type: String})
  public size: IconSize = 'medium';

  protected render() {
    const importedIcon = import(`./assets/${this.icon}.svg?raw`).then(
      iconModule => {
        const svgString = iconModule.default;
        const modifiedSvgString = svgString.replace(
          /stroke=".*?"/g,
          'stroke="currentColor"'
        );
        return unsafeSVG(modifiedSvgString);
      }
    );
    return html`<span class="${this.size}"
      >${until(importedIcon, nothing)}</span
    >`;
  }
}
