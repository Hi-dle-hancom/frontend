/**
 * HAPA VSCode Extension - 프로바이더 등록 관리
 * @fileoverview 모든 프로바이더의 등록과 생명주기를 관리
 */

import * as vscode from "vscode";
import { SidebarProvider } from "../providers/SidebarProvider";
import { GuideProvider } from "../providers/GuideProvider";
import { SettingsProvider } from "../providers/SettingsProvider";
import { OnboardingProvider } from "../providers/OnboardingProvider";
import {
  HAPACompletionProvider,
  HAPAInlineCompletionProvider,
} from "../providers/CompletionProvider";

export interface RegisteredProvider {
  id: string;
  provider: any;
  disposable?: vscode.Disposable;
}

export class ProviderRegistry {
  private providers: Map<string, RegisteredProvider> = new Map();
  private disposables: vscode.Disposable[] = [];

  constructor(private extensionUri: vscode.Uri) {}

  /**
   * 모든 프로바이더 등록
   */
  public async registerAllProviders(
    context: vscode.ExtensionContext
  ): Promise<void> {
    console.log("📦 프로바이더 등록 시작...");

    try {
      // 사이드바 프로바이더
      await this.registerSidebarProvider(context);

      // 웹뷰 프로바이더들
      this.registerWebviewProviders();

      // 코드 완성 프로바이더들
      this.registerCompletionProviders();

      console.log(`✅ 총 ${this.providers.size}개 프로바이더 등록 완료`);
      console.log("📋 등록된 프로바이더:", Array.from(this.providers.keys()));
    } catch (error) {
      console.error("❌ 프로바이더 등록 실패:", error);
      throw error;
    }
  }

  /**
   * 사이드바 프로바이더 등록
   */
  private async registerSidebarProvider(
    context: vscode.ExtensionContext
  ): Promise<void> {
    const sidebarProvider = new SidebarProvider(this.extensionUri);
    sidebarProvider.setContext(context);

    const disposable = vscode.window.registerWebviewViewProvider(
      "hapa-dashboard",
      sidebarProvider
    );

    this.registerProvider("sidebar", sidebarProvider, disposable);
    console.log("✅ 사이드바 프로바이더 등록 완료");
  }

  /**
   * 웹뷰 프로바이더들 등록
   */
  private registerWebviewProviders(): void {
    // 가이드 프로바이더
    const guideProvider = new GuideProvider(this.extensionUri);
    this.registerProvider("guide", guideProvider);

    // 설정 프로바이더
    const settingsProvider = new SettingsProvider(this.extensionUri);
    this.registerProvider("settings", settingsProvider);

    // 온보딩 프로바이더
    const onboardingProvider = new OnboardingProvider(this.extensionUri);
    this.registerProvider("onboarding", onboardingProvider);

    console.log("✅ 웹뷰 프로바이더들 등록 완료");
  }

  /**
   * 코드 완성 프로바이더들 등록
   */
  private registerCompletionProviders(): void {
    const completionProvider = new HAPACompletionProvider();
    const inlineCompletionProvider = new HAPAInlineCompletionProvider();

    const completionDisposable =
      vscode.languages.registerCompletionItemProvider(
        { scheme: "file", language: "python" },
        completionProvider,
        "."
      );

    const inlineDisposable =
      vscode.languages.registerInlineCompletionItemProvider(
        { scheme: "file", language: "python" },
        inlineCompletionProvider
      );

    this.registerProvider(
      "completion",
      completionProvider,
      completionDisposable
    );
    this.registerProvider(
      "inlineCompletion",
      inlineCompletionProvider,
      inlineDisposable
    );

    console.log("✅ 코드 완성 프로바이더들 등록 완료");
  }

  /**
   * 프로바이더 등록 (내부 메서드)
   */
  private registerProvider(
    id: string,
    provider: any,
    disposable?: vscode.Disposable
  ): void {
    this.providers.set(id, {
      id,
      provider,
      disposable,
    });

    if (disposable) {
      this.disposables.push(disposable);
    }
  }

  /**
   * 특정 프로바이더 가져오기
   */
  public getProvider<T>(id: string): T | undefined {
    const registered = this.providers.get(id);
    return registered?.provider as T;
  }

  /**
   * 모든 프로바이더 ID 목록
   */
  public getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 등록된 프로바이더 수
   */
  public getProviderCount(): number {
    return this.providers.size;
  }

  /**
   * 프로바이더 상태 정보
   */
  public getProviderStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};

    for (const [id, registered] of this.providers) {
      // 프로바이더가 제대로 등록되었는지 확인
      status[id] = !!registered.provider;
    }

    return status;
  }

  /**
   * 모든 disposable 가져오기
   */
  public getDisposables(): vscode.Disposable[] {
    return [...this.disposables];
  }

  /**
   * 정리 (deactivate 시 호출)
   */
  public dispose(): void {
    console.log("🔄 프로바이더 정리 시작...");

    // 모든 disposable 정리
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];

    // 프로바이더들 정리
    this.providers.forEach((registered) => {
      if (registered.provider.dispose) {
        registered.provider.dispose();
      }
    });
    this.providers.clear();

    console.log("✅ 프로바이더 정리 완료");
  }
}
