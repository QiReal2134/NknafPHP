<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Setting;
use App\Request;
use App\Response;

class SettingController
{
    public function getSettings(Request $request): Response
    {
        try {
            $settings = Setting::getPublicSettings();

            return Response::success($settings);
        } catch (\Throwable $e) {
            return Response::error('获取设置失败', 500);
        }
    }

    public function updateSettings(Request $request): Response
    {
        $settings = $request->input();

        if (!is_array($settings) || empty($settings)) {
            return Response::error('设置数据格式错误', 400);
        }

        $sanitized = Setting::sanitizeBatch($settings);

        if (empty($sanitized)) {
            return Response::error('没有有效的设置项可更新', 400);
        }

        try {
            Setting::batchSet($sanitized);

            return Response::success(Setting::getPublicSettings(), '设置更新成功');
        } catch (\Throwable $e) {
            return Response::error('更新设置失败', 500);
        }
    }

    public function getProfile(Request $request): Response
    {
        try {
            $profile = Setting::getProfile();

            return Response::success($profile);
        } catch (\Throwable $e) {
            return Response::error('获取博主信息失败', 500);
        }
    }

    public function updateProfile(Request $request): Response
    {
        $data = $request->only(['avatar', 'bio', 'skills', 'social_links']);

        try {
            $profile = Setting::updateProfile($data);

            return Response::success($profile, '博主信息更新成功');
        } catch (\Throwable $e) {
            return Response::error('更新博主信息失败', 500);
        }
    }

    public function getStatistics(Request $request): Response
    {
        try {
            $statistics = Setting::getStatistics();

            return Response::success($statistics);
        } catch (\Throwable $e) {
            return Response::error('获取统计数据失败', 500);
        }
    }
}
